import type { RequestHandler } from "@builder.io/qwik-city";
import { DocumentError, mergeCrdtUpdate } from "~/server/documents";
import { requireAuth } from "~/server/guards";
import { ensureDocId, readJsonBody, respondWithDocumentError } from "./_utils";

interface PushPayload {
  updateB64?: string;
}

export const onPost: RequestHandler = async (ev) => {
  const session = await requireAuth(ev);
  try {
    const payload = await readJsonBody<PushPayload>(ev.request);
    if (!payload.updateB64) {
      throw new DocumentError("updateB64 is required", 400, "invalid_payload");
    }
    const result = await mergeCrdtUpdate(ensureDocId(ev), payload.updateB64, {
      userId: session.userId,
    });
    ev.json(200, { ok: true, ts: result.ts });
  } catch (error) {
    respondWithDocumentError(ev, error);
  }
};
