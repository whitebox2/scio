import { describe, expect, it, beforeEach } from "vitest";
import {
  AuthError,
  AuthService,
  type AuthConfig,
  type AuthRepository,
  LockoutTracker,
  type SshKeyRecord,
} from "~/server/auth";

interface StoredUser {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  ssh_keys: SshKeyRecord[];
}

describe("auth service integration", () => {
  const config: AuthConfig = {
    pbkdf2: { iter: 2000, saltLen: 16, digest: "sha256", keyLength: 32 },
    sessionTtlSec: 300,
    refreshTtlSec: 1200,
    lockoutThreshold: 3,
    lockoutWindowSec: 60,
  };

  beforeEach(() => {
    process.env.SCIO_JWT_SECRET = "integration-secret";
  });

  it("signs up a user and returns a valid session", async () => {
    const repo = new InMemoryAuthRepo();
    const service = new AuthService({
      repo,
      config,
      lockout: new LockoutTracker({ threshold: config.lockoutThreshold, windowSec: config.lockoutWindowSec }),
    });

    const user = await service.signup({ username: "member1", password: "Sup3rStrong!1" });
    expect(user.username).toBe("member1");

    const login = await service.login("member1", "Sup3rStrong!1");
    expect(login.user.id).toEqual(user.id);
    expect(login.session.token).toBeTypeOf("string");
    expect(login.refresh?.token).toBeTypeOf("string");
  });

  it("rejects duplicate usernames", async () => {
    const repo = new InMemoryAuthRepo();
    const service = new AuthService({
      repo,
      config,
      lockout: new LockoutTracker({ threshold: config.lockoutThreshold, windowSec: config.lockoutWindowSec }),
    });

    await service.signup({ username: "member2", password: "Sup3rStrong!1" });
    await expect(service.signup({ username: "member2", password: "Sup3rStrong!1" }))
      .rejects.toMatchObject({ code: "user_exists" });
  });

  it("locks out after repeated failures", async () => {
    const repo = new InMemoryAuthRepo();
    const service = new AuthService({
      repo,
      config,
      lockout: new LockoutTracker({ threshold: config.lockoutThreshold, windowSec: config.lockoutWindowSec }),
    });
    await service.signup({ username: "member3", password: "Sup3rStrong!1" });

    await expect(service.login("member3", "bad-pass"))
      .rejects.toMatchObject({ code: "invalid_credentials" });
    await expect(service.login("member3", "bad-pass"))
      .rejects.toMatchObject({ code: "invalid_credentials" });
    await expect(service.login("member3", "bad-pass"))
      .rejects.toMatchObject({ code: "invalid_credentials" });
    await expect(service.login("member3", "bad-pass"))
      .rejects.toMatchObject({ code: "locked_out" });
  });

  it("manages ssh keys end-to-end", async () => {
    const repo = new InMemoryAuthRepo();
    const service = new AuthService({
      repo,
      config,
      lockout: new LockoutTracker({ threshold: config.lockoutThreshold, windowSec: config.lockoutWindowSec }),
    });
    const user = await service.signup({ username: "member4", password: "Sup3rStrong!1" });

    const sampleKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKwK6JqqPiR+jYwIV/pY5Pja/qvpDMAYA9YV3gCBXlI= dev@host";
    let keys = await service.addSshKey(user.id, { publicKey: sampleKey, label: "laptop" });
    expect(keys).toHaveLength(1);
    expect(keys[0]?.enabled).toBe(true);

    keys = await service.setSshKeyEnabled(user.id, sampleKey, false);
    expect(keys[0]?.enabled).toBe(false);

    keys = await service.removeSshKey(user.id, sampleKey);
    expect(keys).toHaveLength(0);
  });
});

class InMemoryAuthRepo implements AuthRepository {
  private seq = 1;
  private readonly users = new Map<string, StoredUser>();

  async findByUsername(username: string): Promise<StoredUser | null> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return { ...user, ssh_keys: [...user.ssh_keys] };
      }
    }
    return null;
  }

  async findById(userId: string): Promise<StoredUser | null> {
    const user = this.users.get(userId);
    return user ? { ...user, ssh_keys: [...user.ssh_keys] } : null;
  }

  async createUser(input: { username: string; passwordHash: string; role: string }): Promise<StoredUser> {
    const id = `user:${this.seq.toString()}`;
    this.seq += 1;
    const user: StoredUser = {
      id,
      username: input.username,
      password_hash: input.passwordHash,
      role: input.role,
      ssh_keys: [],
    };
    this.users.set(id, user);
    return { ...user, ssh_keys: [] };
  }

  async saveSshKeys(userId: string, keys: SshKeyRecord[]): Promise<SshKeyRecord[]> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }
    user.ssh_keys = keys.map((key) => ({ ...key }));
    return user.ssh_keys.map((key) => ({ ...key }));
  }
}
