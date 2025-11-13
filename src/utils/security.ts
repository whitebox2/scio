import { Buffer } from "node:buffer";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import type { JWTPayload, JWTVerifyResult } from "jose";
import { SignJWT, jwtVerify } from "jose";

// Security-critical helpers must comply with ./work/scio/.serena/memories/rule.md (strong hashing, explicit errors).
const HASH_PREFIX = "pbkdf2";
const TOKEN_USE_SESSION = "session";
const TOKEN_USE_REFRESH = "refresh";
const DEFAULT_DIGEST = "sha256" satisfies Pbkdf2Params["digest"];
const DEFAULT_KEY_LENGTH = 32;

let cachedSecret: { raw: string; key: Uint8Array } | null = null;

export type Pbkdf2Params = {
  iter: number;
  saltLen: number;
  digest: "sha256" | "sha512";
  keyLength?: number;
};

export interface SignedToken {
  token: string;
  expiresAt: number;
  ttlSec: number;
}

export const nowEpochSeconds = (): number => Math.floor(Date.now() / 1000);

export function readPbkdf2ParamsFromEnv(): Required<Pbkdf2Params> {
  return {
    iter: readIntEnv("SCIO_AUTH_PBKDF2_ITER", 210_000, 50_000),
    saltLen: readIntEnv("SCIO_AUTH_SALT_LEN", 16, 8),
    digest: parseDigest(process.env.SCIO_AUTH_DIGEST ?? DEFAULT_DIGEST),
    keyLength: DEFAULT_KEY_LENGTH,
  };
}

export function hashPassword(plain: string, params?: Pbkdf2Params): string {
  if (!plain || plain.length < 1) {
    throw new Error("Password cannot be empty");
  }
  const { iter, saltLen, digest, keyLength } = params ?? readPbkdf2ParamsFromEnv();
  const salt = randomBytes(saltLen);
  const hash = pbkdf2Sync(plain, salt, iter, keyLength ?? DEFAULT_KEY_LENGTH, digest);
  return `${HASH_PREFIX}_${digest}$${iter}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const parsed = parseStoredHash(stored);
  if (!parsed) {
    return false;
  }
  const { digest, iter, salt, expected } = parsed;
  const derived = pbkdf2Sync(plain, salt, iter, expected.length, digest);
  return timingSafeEqual(derived, expected);
}

export async function signSession(subject: string, ttlSec: number, claims?: JWTPayload): Promise<SignedToken> {
  return signToken(subject, ttlSec, TOKEN_USE_SESSION, claims);
}

export async function signRefreshToken(subject: string, ttlSec: number, claims?: JWTPayload): Promise<SignedToken> {
  return signToken(subject, ttlSec, TOKEN_USE_REFRESH, claims);
}

export async function verifySession(token: string): Promise<JWTVerifyResult<JWTPayload>> {
  const result = await verifyToken(token);
  if (result.payload.token_use !== TOKEN_USE_SESSION) {
    throw new Error("Invalid session token");
  }
  return result;
}

export async function verifyRefreshToken(token: string): Promise<JWTVerifyResult<JWTPayload>> {
  const result = await verifyToken(token);
  if (result.payload.token_use !== TOKEN_USE_REFRESH) {
    throw new Error("Invalid refresh token");
  }
  return result;
}

function parseStoredHash(stored: string): null | {
  digest: "sha256" | "sha512";
  iter: number;
  salt: Buffer;
  expected: Buffer;
} {
  const match = stored.match(/^pbkdf2_(sha256|sha512)\$(\d+)\$([A-Za-z0-9+/=]+)\$([A-Za-z0-9+/=]+)$/);
  if (!match) {
    return null;
  }
  const [, digest, iterRaw, saltB64, hashB64] = match;
  const iter = Number(iterRaw);
  if (!Number.isFinite(iter) || iter <= 0) {
    return null;
  }
  return {
    digest: digest as "sha256" | "sha512",
    iter,
    salt: Buffer.from(saltB64, "base64"),
    expected: Buffer.from(hashB64, "base64"),
  };
}

async function signToken(subject: string, ttlSec: number, tokenUse: string, claims?: JWTPayload): Promise<SignedToken> {
  if (!subject) {
    throw new Error("JWT subject is required");
  }
  const ttl = Math.max(ttlSec, 1);
  const issuedAt = nowEpochSeconds();
  const expiresAt = issuedAt + ttl;
  const payload: JWTPayload = {
    ...claims,
    sub: subject,
    token_use: tokenUse,
  };
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(readJwtSecret());
  return { token, expiresAt, ttlSec: ttl };
}

async function verifyToken(token: string): Promise<JWTVerifyResult<JWTPayload>> {
  if (!token) {
    throw new Error("Missing token");
  }
  return jwtVerify(token, readJwtSecret(), { algorithms: ["HS256"] });
}

function readJwtSecret(): Uint8Array {
  const secret = process.env.SCIO_JWT_SECRET;
  if (!secret) {
    throw new Error("SCIO_JWT_SECRET is not set");
  }
  if (cachedSecret && cachedSecret.raw === secret) {
    return cachedSecret.key;
  }
  const key = new TextEncoder().encode(secret);
  cachedSecret = { raw: secret, key };
  return key;
}

function parseDigest(value: string): "sha256" | "sha512" {
  return value === "sha512" ? "sha512" : "sha256";
}

function readIntEnv(name: string, fallback: number, minValue: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < minValue) {
    throw new Error(`${name} must be a number >= ${minValue}`);
  }
  return parsed;
}
