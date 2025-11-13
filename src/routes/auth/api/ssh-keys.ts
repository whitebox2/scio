import type { RequestHandler } from "@builder.io/qwik-city";
import { AuthError, withAuthService } from "~/server/auth";
import { requireAuth } from "~/server/guards";
import { readJsonBody, respondWithError } from "./_utils";

interface AddPayload {
  publicKey: unknown;
  label?: unknown;
}

interface TogglePayload {
  publicKey: unknown;
  enabled: unknown;
}

interface RemovePayload {
  publicKey: unknown;
}

export const onGet: RequestHandler = async (ev) => {
  try {
    const session = await requireAuth(ev);
    const keys = await withAuthService((service) => service.listSshKeys(session.userId));
    ev.json(200, { ok: true, keys });
  } catch (error) {
    respondWithError(ev, error);
  }
};

export const onPost: RequestHandler = async (ev) => {
  try {
    const session = await requireAuth(ev);
    const body = await readJsonBody<AddPayload>(ev.request);
    if (typeof body.publicKey !== "string") {
      throw new AuthError("publicKey is required", 400, "invalid_payload");
    }
    const publicKey = body.publicKey;
    const label = typeof body.label === "string" ? body.label : undefined;
    const keys = await withAuthService((service) =>
      service.addSshKey(session.userId, { publicKey, label }),
    );
    ev.json(200, { ok: true, keys });
  } catch (error) {
    respondWithError(ev, error);
  }
};

export const onPatch: RequestHandler = async (ev) => {
  try {
    const session = await requireAuth(ev);
    const body = await readJsonBody<TogglePayload>(ev.request);
    if (typeof body.publicKey !== "string" || typeof body.enabled !== "boolean") {
      throw new AuthError("publicKey and enabled are required", 400, "invalid_payload");
    }
    const publicKey = body.publicKey;
    const enabled = body.enabled;
    const keys = await withAuthService((service) =>
      service.setSshKeyEnabled(session.userId, publicKey, enabled),
    );
    ev.json(200, { ok: true, keys });
  } catch (error) {
    respondWithError(ev, error);
  }
};

export const onDelete: RequestHandler = async (ev) => {
  try {
    const session = await requireAuth(ev);
    const body = await readJsonBody<RemovePayload>(ev.request);
    if (typeof body.publicKey !== "string") {
      throw new AuthError("publicKey is required", 400, "invalid_payload");
    }
    const publicKey = body.publicKey;
    const keys = await withAuthService((service) => service.removeSshKey(session.userId, publicKey));
    ev.json(200, { ok: true, keys });
  } catch (error) {
    respondWithError(ev, error);
  }
};
