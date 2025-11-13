import type { RequestHandler } from "@builder.io/qwik-city";
import { DocumentError, diffCrdtState } from "~/server/documents";
import { requireAuth } from "~/server/guards";
import { ensureDocId, readJsonBody, respondWithDocumentError } from "./_utils";

interface PullPayload {
  stateVectorB64?: string;
}

export const onPost: RequestHandler = async (ev) => {
  await requireAuth(ev);
  try {
    const payload = await readJsonBody<PullPayload>(ev.request);
    if (!payload.stateVectorB64) {
      throw new DocumentError("stateVectorB64 is required", 400, "invalid_payload");
    }
    const result = await diffCrdtState(ensureDocId(ev), payload.stateVectorB64);
    ev.json(200, { ok: true, updateB64: result.updateB64, ts: result.ts });
  } catch (error) {
    respondWithDocumentError(ev, error);
  }
};
