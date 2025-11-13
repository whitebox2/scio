import type { RequestEvent } from "@builder.io/qwik-city";
import { AuthError } from "~/server/auth";
import { sendJsonError } from "~/utils/http";

export async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AuthError("Invalid JSON payload", 400, "invalid_payload");
  }
}

export function respondWithError(ev: RequestEvent, error: unknown): void {
  if (error instanceof AuthError) {
    sendJsonError(ev, error.status, {
      ok: false,
      error: error.message,
      code: error.code,
      hint: error.hint,
    });
    return;
  }
  sendJsonError(ev, 500, { ok: false, error: "Internal Server Error" });
}
