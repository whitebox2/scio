import type { RequestHandler } from "@builder.io/qwik-city";
import { AuthError, withAuthService } from "~/server/auth";
import { clearRefreshCookie, setRefreshCookie, setSessionCookie } from "~/utils/http";
import { readJsonBody, respondWithError } from "./_utils";

interface LoginPayload {
  username: unknown;
  password: unknown;
}

export const onPost: RequestHandler = async (ev) => {
  try {
    const body = await readJsonBody<LoginPayload>(ev.request);
    if (typeof body.username !== "string" || typeof body.password !== "string") {
      throw new AuthError("username and password are required", 400, "invalid_payload");
    }
    const username = body.username;
    const password = body.password;
    const contextKey = extractContextKey(ev.request);
    const result = await withAuthService((service) =>
      service.login(username, password, { contextKey }),
    );
    setSessionCookie(ev, result.session.token, result.session.ttlSec);
    if (result.refresh) {
      setRefreshCookie(ev, result.refresh.token, result.refresh.ttlSec);
    } else {
      clearRefreshCookie(ev);
    }
    ev.json(200, { ok: true, user: result.user, expiresAt: result.session.expiresAt });
  } catch (error) {
    respondWithError(ev, error);
  }
};

function extractContextKey(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) {
    return forwarded;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp && realIp.length > 0 ? realIp : undefined;
}
