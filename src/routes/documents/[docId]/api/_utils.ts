import type { RequestEvent } from "@builder.io/qwik-city";
import { DocumentError } from "~/server/documents";
import { PolicyError } from "~/server/policy";
import { sendJsonError } from "~/utils/http";

export async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new DocumentError("Invalid JSON payload", 400, "invalid_payload");
  }
}

export function ensureDocId(ev: RequestEvent): string {
  const docId = ev.params.docId;
  if (!docId) {
    throw new DocumentError("docId is required", 400, "invalid_doc_id");
  }
  return docId;
}

export function respondWithDocumentError(ev: RequestEvent, error: unknown): void {
  if (error instanceof DocumentError) {
    sendJsonError(ev, error.status, { ok: false, error: error.message, code: error.code });
    return;
  }
  if (error instanceof PolicyError) {
    sendJsonError(ev, error.status, { ok: false, error: error.message, code: error.code, details: error.details });
    return;
  }
  sendJsonError(ev, 500, { ok: false, error: "Internal Server Error" });
}
