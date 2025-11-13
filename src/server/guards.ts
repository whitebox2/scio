import type { RequestEventCommon } from "@builder.io/qwik-city";
import { SESSION_COOKIE_NAME } from "~/utils/http";
import { verifySession } from "~/utils/security";
import { AuthError } from "./auth";

export interface AuthContext {
  userId: string;
  username?: string;
}

export async function requireAuth(ev: RequestEventCommon): Promise<AuthContext> {
  const token = ev.cookie.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    throw new AuthError("Unauthorized", 401, "unauthorized");
  }
  try {
    const { payload } = await verifySession(token);
    const userId = typeof payload.sub === "string" ? payload.sub : undefined;
    if (!userId) {
      throw new Error("Missing subject");
    }
    return {
      userId,
      username: typeof payload.username === "string" ? payload.username : undefined,
    } satisfies AuthContext;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError("Unauthorized", 401, "unauthorized");
  }
}
