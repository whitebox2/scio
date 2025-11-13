import type { RequestHandler } from "@builder.io/qwik-city";
import { AuthError, withAuthService } from "~/server/auth";
import { readJsonBody, respondWithError } from "./_utils";

interface SignupPayload {
  username: unknown;
  password: unknown;
}

export const onPost: RequestHandler = async (ev) => {
  try {
    const body = await readJsonBody<SignupPayload>(ev.request);
    if (typeof body.username !== "string" || typeof body.password !== "string") {
      throw new AuthError("username and password are required", 400, "invalid_payload");
    }
    const username = body.username;
    const password = body.password;
    const user = await withAuthService((service) =>
      service.signup({ username, password }),
    );
    ev.json(201, { ok: true, user });
  } catch (error) {
    respondWithError(ev, error);
  }
};
