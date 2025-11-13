import type { RequestHandler } from "@builder.io/qwik-city";
import type { SerializedEditorState } from "lexical";
import { getDocumentForEditor, patchDocumentMetadata } from "~/server/documents";
import { requireAuth } from "~/server/guards";
import { ensureDocId, readJsonBody, respondWithDocumentError } from "./_utils";

interface PatchPayload {
  title?: unknown;
  tags?: unknown;
  snapshot?: SerializedEditorState | null;
  note?: unknown;
}

export const onGet: RequestHandler = async (ev) => {
  await requireAuth(ev);
  try {
    const document = await getDocumentForEditor(ensureDocId(ev));
    ev.json(200, { ok: true, document });
  } catch (error) {
    respondWithDocumentError(ev, error);
  }
};

export const onPatch: RequestHandler = async (ev) => {
  const session = await requireAuth(ev);
  try {
    const payload = await readJsonBody<PatchPayload>(ev.request);
    const document = await patchDocumentMetadata(
      ensureDocId(ev),
      {
        title: payload.title,
        tags: payload.tags,
        snapshot: payload.snapshot ?? null,
        note: payload.note,
      },
      { userId: session.userId },
    );
    ev.json(200, { ok: true, document });
  } catch (error) {
    respondWithDocumentError(ev, error);
  }
};
