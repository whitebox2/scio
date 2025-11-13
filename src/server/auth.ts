import { Buffer } from "node:buffer";
import type { SurrealClient } from "~/adapters/db.surreal";
import { connect, exec } from "~/adapters/db.surreal";
import type { User } from "~/models/domain";
import {
  hashPassword,
  readPbkdf2ParamsFromEnv,
  signRefreshToken,
  signSession,
  verifyPassword,
  type Pbkdf2Params,
  type SignedToken,
} from "~/utils/security";

// All logic here follows ./work/scio/.serena/memories/rule.md: explicit validation, strong hashing, and defensive error reporting.

const DEFAULT_ROLE = "member";
const SUPPORTED_KEY_TYPES = ["ssh-ed25519", "ssh-rsa", "ecdsa-sha2-nistp256"] as const;
const SSH_KEY_MAX_CHARS = 4096;
const SSH_KEY_MIN_BYTES = 32;
const SSH_LABEL_MAX = 80;
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])?$/;

type QueryResultRow<T> = { result?: T[] };

export type SshKeyRecord = NonNullable<User["ssh_keys"]>[number];

export class AuthError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string, public readonly hint?: string) {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthConfig {
  pbkdf2: Required<Pbkdf2Params>;
  sessionTtlSec: number;
  refreshTtlSec?: number;
  lockoutThreshold: number;
  lockoutWindowSec: number;
}

export interface SignupInput {
  username: string;
  password: string;
  role?: string;
}

export interface LoginOptions {
  contextKey?: string;
}

export interface LoginResult {
  session: SignedToken;
  refresh?: SignedToken;
  user: Pick<User, "id" | "username" | "role">;
}

export interface AuthRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(userId: string): Promise<User | null>;
  createUser(input: { username: string; passwordHash: string; role: string }): Promise<User>;
  saveSshKeys(userId: string, keys: SshKeyRecord[]): Promise<SshKeyRecord[]>;
}

export class AuthService {
  private readonly repo: AuthRepository;
  private readonly config: AuthConfig;
  private readonly lockout: LockoutTracker;
  private readonly now: () => number;

  constructor(input: { repo: AuthRepository; config: AuthConfig; lockout: LockoutTracker; clock?: () => number }) {
    this.repo = input.repo;
    this.config = input.config;
    this.lockout = input.lockout;
    this.now = input.clock ?? (() => Date.now());
  }

  async signup(input: SignupInput): Promise<Pick<User, "id" | "username" | "role">> {
    const username = normalizeUsername(input.username);
    validateUsername(username);
    passwordPolicy(input.password);

    const existing = await this.repo.findByUsername(username);
    if (existing) {
      throw new AuthError("Username already registered", 409, "user_exists");
    }

    const passwordHash = hashPassword(input.password, this.config.pbkdf2);
    const created = await this.repo.createUser({
      username,
      passwordHash,
      role: input.role ?? DEFAULT_ROLE,
    });
    return toSafeUser(created);
  }

  async login(usernameRaw: string, password: string, options?: LoginOptions): Promise<LoginResult> {
    const username = normalizeUsername(usernameRaw);
    validateUsername(username);
    const lockKeys = buildLockKeys(username, options?.contextKey);
    this.ensureNotLocked(lockKeys);

    const user = await this.repo.findByUsername(username);
    if (!user || !verifyPassword(password, user.password_hash)) {
      const status = this.lockout.recordFailure(lockKeys, epochSeconds(this.now()));
      const hint = status.retryAfterSec ? `Retry after ${status.retryAfterSec}s` : undefined;
      throw new AuthError("Invalid credentials", 401, "invalid_credentials", hint);
    }

    this.lockout.reset(lockKeys);

    const session = await signSession(user.id, this.config.sessionTtlSec, { username: user.username });
    const result: LoginResult = {
      session,
      user: toSafeUser(user),
    };
    if (this.config.refreshTtlSec && this.config.refreshTtlSec > 0) {
      result.refresh = await signRefreshToken(user.id, this.config.refreshTtlSec, { username: user.username });
    }
    return result;
  }

  async listSshKeys(userId: string): Promise<SshKeyRecord[]> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new AuthError("User not found", 404, "user_not_found");
    }
    return normalizeSshKeys(user.ssh_keys ?? []);
  }

  async addSshKey(userId: string, input: { publicKey: string; label?: string }): Promise<SshKeyRecord[]> {
    const normalizedKey = normalizeSshPublicKey(input.publicKey);
    const sanitizedLabel = sanitizeLabel(input.label);
    const existing = await this.listSshKeys(userId);
    if (existing.some((k) => k.public_key === normalizedKey)) {
      throw new AuthError("SSH key already registered", 409, "ssh_key_exists");
    }
    const next = [...existing, { public_key: normalizedKey, label: sanitizedLabel, enabled: true } satisfies SshKeyRecord];
    await this.repo.saveSshKeys(userId, next);
    return next;
  }

  async setSshKeyEnabled(userId: string, publicKey: string, enabled: boolean): Promise<SshKeyRecord[]> {
    const normalizedKey = normalizeSshPublicKey(publicKey);
    const existing = await this.listSshKeys(userId);
    const idx = existing.findIndex((k) => k.public_key === normalizedKey);
    if (idx === -1) {
      throw new AuthError("SSH key not found", 404, "ssh_key_missing");
    }
    const updated = [...existing];
    updated[idx] = { ...updated[idx], enabled } satisfies SshKeyRecord;
    await this.repo.saveSshKeys(userId, updated);
    return updated;
  }

  async removeSshKey(userId: string, publicKey: string): Promise<SshKeyRecord[]> {
    const normalizedKey = normalizeSshPublicKey(publicKey);
    const existing = await this.listSshKeys(userId);
    const filtered = existing.filter((k) => k.public_key !== normalizedKey);
    if (filtered.length === existing.length) {
      throw new AuthError("SSH key not found", 404, "ssh_key_missing");
    }
    await this.repo.saveSshKeys(userId, filtered);
    return filtered;
  }

  private ensureNotLocked(keys: string[]): void {
    const locked = this.lockout.isLocked(keys, epochSeconds(this.now()));
    if (locked.locked) {
      const hint = locked.retryAfterSec ? `Retry after ${locked.retryAfterSec}s` : undefined;
      throw new AuthError("Too many failed attempts", 429, "locked_out", hint);
    }
  }
}

export class LockoutTracker {
  private readonly attempts = new Map<string, number[]>();

  constructor(private readonly config: { threshold: number; windowSec: number }) {}

  recordFailure(keys: string[], nowSec: number): { locked: boolean; retryAfterSec: number } {
    let locked = false;
    let retryAfterSec = 0;
    for (const key of keys) {
      const list = this.touch(key, nowSec);
      if (list.length >= this.config.threshold) {
        locked = true;
        retryAfterSec = Math.max(retryAfterSec, this.computeRetry(list, nowSec));
      }
    }
    return { locked, retryAfterSec };
  }

  reset(keys: string[]): void {
    for (const key of keys) {
      this.attempts.delete(key);
    }
  }

  isLocked(keys: string[], nowSec: number): { locked: boolean; retryAfterSec: number } {
    let locked = false;
    let retryAfterSec = 0;
    for (const key of keys) {
      const list = this.cleanup(key, nowSec);
      if (list.length >= this.config.threshold) {
        locked = true;
        retryAfterSec = Math.max(retryAfterSec, this.computeRetry(list, nowSec));
      }
    }
    return { locked, retryAfterSec };
  }

  private touch(key: string, nowSec: number): number[] {
    const list = this.cleanup(key, nowSec);
    list.push(nowSec);
    this.attempts.set(key, list);
    return list;
  }

  private cleanup(key: string, nowSec: number): number[] {
    const list = this.attempts.get(key) ?? [];
    const cutoff = nowSec - this.config.windowSec;
    const filtered = list.filter((ts) => ts > cutoff);
    this.attempts.set(key, filtered);
    return filtered;
  }

  private computeRetry(list: number[], nowSec: number): number {
    if (list.length === 0) {
      return 0;
    }
    const oldest = list[0];
    const elapsed = nowSec - oldest;
    return Math.max(this.config.windowSec - elapsed, 0);
  }
}

export class SurrealAuthRepository implements AuthRepository {
  constructor(private readonly db: SurrealClient) {}

  async findByUsername(username: string): Promise<User | null> {
    const rows = await exec<QueryResultRow<User>[]>(this.db, "SELECT * FROM users WHERE username = $username LIMIT 1", { username });
    return firstRow<User>(rows);
  }

  async findById(userId: string): Promise<User | null> {
    const id = ensureThing("users", userId);
    const rows = await exec<QueryResultRow<User>[]>(this.db, "SELECT * FROM type::thing($id) LIMIT 1", { id });
    return firstRow<User>(rows);
  }

  async createUser(input: { username: string; passwordHash: string; role: string }): Promise<User> {
    const rows = await exec<QueryResultRow<User>[]>(
      this.db,
      "CREATE users SET username = $username, password_hash = $passwordHash, role = $role, ssh_keys = [] RETURN AFTER",
      input,
    );
    const created = firstRow<User>(rows);
    if (!created) {
      throw new Error("Failed to create user");
    }
    return created;
  }

  async saveSshKeys(userId: string, keys: SshKeyRecord[]): Promise<SshKeyRecord[]> {
    const id = ensureThing("users", userId);
    const rows = await exec<QueryResultRow<User>[]>(
      this.db,
      "UPDATE type::thing($id) SET ssh_keys = $keys, updated_at = time::now() RETURN AFTER",
      { id, keys },
    );
    const updated = firstRow<User>(rows);
    if (!updated) {
      throw new Error("Failed to update ssh_keys");
    }
    return normalizeSshKeys(updated.ssh_keys ?? []);
  }
}

class MemoryAuthRepository implements AuthRepository {
  private seq = 1;
  private readonly users = new Map<string, User>();

  async findByUsername(username: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return cloneUser(user);
      }
    }
    return null;
  }

  async findById(userId: string): Promise<User | null> {
    const user = this.users.get(userId);
    return user ? cloneUser(user) : null;
  }

  async createUser(input: { username: string; passwordHash: string; role: string }): Promise<User> {
    const id = `user:${this.seq}`;
    this.seq += 1;
    const user: User = {
      id,
      username: input.username,
      password_hash: input.passwordHash,
      role: input.role,
      ssh_keys: [],
    };
    this.users.set(id, user);
    return cloneUser(user) as User;
  }

  async saveSshKeys(userId: string, keys: SshKeyRecord[]): Promise<SshKeyRecord[]> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    user.ssh_keys = keys.map((key) => ({ ...key }));
    return normalizeSshKeys(user.ssh_keys);
  }
}

const lockoutConfig = {
  threshold: readIntEnv("SCIO_LOCKOUT_THRESHOLD", 10, 3),
  windowSec: readIntEnv("SCIO_LOCKOUT_WINDOW_SEC", 900, 60),
};

const globalLockout = new LockoutTracker(lockoutConfig);

export async function withAuthService<T>(handler: (service: AuthService) => Promise<T>): Promise<T> {
  if (process.env.SCIO_AUTH_DRIVER === "memory") {
    const service = new AuthService({
      repo: getMemoryAuthRepository(),
      config: loadAuthConfig(),
      lockout: globalLockout,
    });
    return handler(service);
  }
  const db = await connect();
  try {
    const service = new AuthService({
      repo: new SurrealAuthRepository(db),
      config: loadAuthConfig(),
      lockout: globalLockout,
    });
    return await handler(service);
  } finally {
    await db.close();
  }
}

export function loadAuthConfig(): AuthConfig {
  return {
    pbkdf2: readPbkdf2ParamsFromEnv(),
    sessionTtlSec: readIntEnv("SCIO_SESSION_TTL_SEC", 1800, 60),
    refreshTtlSec: readOptionalIntEnv("SCIO_REFRESH_TTL_SEC"),
    lockoutThreshold: lockoutConfig.threshold,
    lockoutWindowSec: lockoutConfig.windowSec,
  };
}

export function passwordPolicy(password: string): void {
  if (password.length < 12) {
    throw new AuthError("Password must be at least 12 characters", 400, "weak_password");
  }
  if (!/[A-Z]/u.test(password) || !/[a-z]/u.test(password) || !/[0-9]/u.test(password) || !/[^\w\s]/u.test(password)) {
    throw new AuthError("Password must include upper, lower, digit, and symbol", 400, "weak_password");
  }
  if (/\s/u.test(password)) {
    throw new AuthError("Password cannot contain whitespace", 400, "weak_password");
  }
}

export function validateUsername(username: string): void {
  if (username.length < 3 || username.length > 32) {
    throw new AuthError("Username must be 3-32 characters", 400, "invalid_username");
  }
  if (!USERNAME_PATTERN.test(username)) {
    throw new AuthError("Username can contain lowercase letters, numbers, '.', '-', '_'", 400, "invalid_username");
  }
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function normalizeSshKeys(keys: SshKeyRecord[]): SshKeyRecord[] {
  return keys.map((key) => ({
    public_key: key.public_key.trim(),
    label: sanitizeLabel(key.label),
    enabled: key.enabled ?? true,
  }));
}

export function normalizeSshPublicKey(publicKey: string): string {
  const trimmed = publicKey.trim().replace(/\s+/g, " ");
  validateSshPublicKey(trimmed);
  return trimmed;
}

function validateSshPublicKey(publicKey: string): void {
  if (!publicKey) {
    throw new AuthError("SSH key is required", 400, "invalid_ssh_key");
  }
  if (publicKey.length > SSH_KEY_MAX_CHARS) {
    throw new AuthError("SSH key is too long", 400, "invalid_ssh_key");
  }
  const parts = publicKey.split(" ");
  if (parts.length < 2) {
    throw new AuthError("SSH key must include type and base64 payload", 400, "invalid_ssh_key");
  }
  const [type, payload] = parts;
  if (!SUPPORTED_KEY_TYPES.includes(type as (typeof SUPPORTED_KEY_TYPES)[number])) {
    throw new AuthError("Unsupported SSH key type", 400, "invalid_ssh_key");
  }
  if (!/^[A-Za-z0-9+/=]+$/u.test(payload)) {
    throw new AuthError("SSH key payload must be base64", 400, "invalid_ssh_key");
  }
  const decoded = Buffer.from(payload, "base64");
  if (decoded.byteLength < SSH_KEY_MIN_BYTES) {
    throw new AuthError("SSH key payload is too short", 400, "invalid_ssh_key");
  }
}

function sanitizeLabel(label?: string): string | undefined {
  if (!label) {
    return undefined;
  }
  const trimmed = label.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, SSH_LABEL_MAX);
}

function buildLockKeys(username: string, contextKey?: string): string[] {
  const keys = [`acct:${username}`];
  if (contextKey) {
    keys.push(`ctx:${contextKey}`);
  }
  return keys;
}

function ensureThing(table: string, id: string): string {
  return id.includes(":") ? id : `${table}:${id}`;
}

function firstRow<T>(rows: QueryResultRow<T>[] | undefined): T | null {
  if (!rows) {
    return null;
  }
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const entry = rows[i];
    if (Array.isArray(entry?.result) && entry.result.length > 0) {
      return entry.result[0] as T;
    }
  }
  return null;
}

function epochSeconds(now: number): number {
  return Math.floor(now / 1000);
}

function readIntEnv(name: string, fallback: number, min: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min) {
    throw new Error(`${name} must be >= ${min}`);
  }
  return value;
}

function readOptionalIntEnv(name: string): number | undefined {
  const raw = process.env[name];
  if (!raw) {
    return undefined;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function toSafeUser(user: User): Pick<User, "id" | "username" | "role"> {
  return { id: user.id, username: user.username, role: user.role };
}

function cloneUser(user: User): User {
  return {
    ...user,
    ssh_keys: user.ssh_keys ? user.ssh_keys.map((key) => ({ ...key })) : undefined,
  };
}

function getMemoryAuthRepository(): MemoryAuthRepository {
  if (!globalThis.__scioMemoryAuthRepo) {
    globalThis.__scioMemoryAuthRepo = new MemoryAuthRepository();
  }
  return globalThis.__scioMemoryAuthRepo;
}

declare global {
  // eslint-disable-next-line no-var
  var __scioMemoryAuthRepo: MemoryAuthRepository | undefined;
}
