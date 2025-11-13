import { beforeEach, describe, expect, it } from "vitest";
import {
  hashPassword,
  nowEpochSeconds,
  signSession,
  verifyPassword,
  verifySession,
  type Pbkdf2Params,
} from "~/utils/security";

describe("security utils", () => {
  beforeEach(() => {
    process.env.SCIO_JWT_SECRET = "unit-test-secret";
    delete process.env.SCIO_AUTH_PBKDF2_ITER;
    delete process.env.SCIO_AUTH_SALT_LEN;
  });

  it("hashes and verifies passwords", () => {
    const params: Pbkdf2Params = { iter: 1000, saltLen: 8, digest: "sha256", keyLength: 32 };
    const hash = hashPassword("Sup3rSaf3!", params);
    expect(hash).toMatch(/^pbkdf2_sha(256|512)/);
    expect(verifyPassword("Sup3rSaf3!", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("signs and verifies session tokens with ttl", async () => {
    const session = await signSession("user-1", 120, { username: "user-1" });
    expect(session.ttlSec).toBe(120);
    const now = nowEpochSeconds();
    expect(session.expiresAt).toBeGreaterThanOrEqual(now + 119);
    const verified = await verifySession(session.token);
    expect(verified.payload.sub).toBe("user-1");
    expect(verified.payload.token_use).toBe("session");
  });
});
