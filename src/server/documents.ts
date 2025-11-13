import type { SerializedEditorState } from "lexical";
import * as Y from "yjs";
import type { SurrealClient } from "~/adapters/db.surreal";
import { connect, exec } from "~/adapters/db.surreal";
import type { Document } from "~/models/domain";
import { SurrealDocumentsRepo } from "~/models/repo.surreal";
import { composeSearchBlob } from "~/models/repo";
import { decodeBase64, encodeBase64 } from "~/utils/base64";
import {
  createEmptyLexicalState,
  ensureSerializedState,
  lexicalStateToHtml,
  writeSnapshotToDoc,
} from "~/utils/lexical-serialization";
import { emitServerMetric } from "~/utils/telemetry";
import {
  DEFAULT_CRDT_PULL_LIMIT_BYTES,
  DEFAULT_CRDT_PUSH_LIMIT_BYTES,
  PolicyError,
  enforceTagPolicy,
  ensurePayloadLimit,
} from "./policy";

export class DocumentError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string) {
    super(message);
    this.name = "DocumentError";
  }
}

export interface DocumentReaderPayload {
  id: string;
  title: string;
  tags: string[];
  snapshot: SerializedEditorState;
  html: string;
  updatedAt?: string;
  updatedBy?: string | null;
  projectId: string;
  folderId?: string | null;
}

export interface DocumentEditorPayload extends DocumentReaderPayload {
  crdtB64: string | null;
}

export interface DocumentPatchInput {
  title?: unknown;
  tags?: unknown;
  snapshot?: SerializedEditorState | null;
  note?: unknown;
}

export async function getDocumentForReader(docId: string): Promise<DocumentReaderPayload> {
  return withDb(async (db) => {
    const repo = new SurrealDocumentsRepo(db);
    const doc = await requireDocument(repo, docId);
    const snapshot = ensureSerializedState(doc.body_rich ?? createEmptyLexicalState());
    return {
      id: doc.id,
      title: doc.title,
      tags: sanitizeExistingTags(doc.tags),
      snapshot,
      html: lexicalStateToHtml(snapshot),
      updatedAt: doc.updated_at,
      updatedBy: doc.updated_by,
      projectId: doc.project_id,
      folderId: doc.folder_id,
    } satisfies DocumentReaderPayload;
  });
}

export async function getDocumentForEditor(docId: string): Promise<DocumentEditorPayload> {
  return withDb(async (db) => {
    const repo = new SurrealDocumentsRepo(db);
    const doc = await requireDocument(repo, docId);
    const snapshot = ensureSerializedState(doc.body_rich ?? createEmptyLexicalState());
    return {
      id: doc.id,
      title: doc.title,
      tags: sanitizeExistingTags(doc.tags),
      snapshot,
      html: lexicalStateToHtml(snapshot),
      updatedAt: doc.updated_at,
      updatedBy: doc.updated_by,
      projectId: doc.project_id,
      folderId: doc.folder_id,
      crdtB64: doc.crdt_b64 ?? null,
    } satisfies DocumentEditorPayload;
  });
}

export async function patchDocumentMetadata(
  docId: string,
  input: DocumentPatchInput,
  context: { userId: string },
): Promise<DocumentEditorPayload> {
  return withDb(async (db) => {
    const repo = new SurrealDocumentsRepo(db);
    const doc = await requireDocument(repo, docId);
    const nextTitle = input.title === undefined ? doc.title : normalizeTitle(input.title);
    const nextTags = input.tags === undefined ? sanitizeExistingTags(doc.tags) : enforceTagPolicy({ tags: input.tags });
    const nextSnapshot = ensureSerializedState(input.snapshot ?? doc.body_rich ?? createEmptyLexicalState());
    const nowIso = new Date().toISOString();

    await repo.update(doc.id, {
      title: nextTitle,
      tags: nextTags,
      body_rich: nextSnapshot,
      search_blob: composeSearchBlob(nextTitle, nextSnapshot),
      updated_by: ensureThing("users", context.userId),
    });

    await createRevisionRecord(db, doc.id, context.userId, normalizeNote(input.note));

    // Keep CRDT snapshot aligned so that SSR can fall back when needed.
    const latestCrdt = await persistSnapshotIntoCrdt(db, doc.id, doc.crdt_b64 ?? null, nextSnapshot, context.userId);

    emitServerMetric({
      event: "doc_patch",
      docId,
      userId: context.userId,
      tagCount: nextTags.length,
    });

    return {
      id: doc.id,
      title: nextTitle,
      tags: nextTags,
      snapshot: nextSnapshot,
      html: lexicalStateToHtml(nextSnapshot),
      updatedAt: nowIso,
      updatedBy: ensureThing("users", context.userId),
      projectId: doc.project_id,
      folderId: doc.folder_id,
      crdtB64: latestCrdt,
    } satisfies DocumentEditorPayload;
  });
}

export async function mergeCrdtUpdate(
  docId: string,
  updateB64: string,
  context: { userId: string; maxBytes?: number },
): Promise<{ ts: string; mergedBytes: number }> {
  return withDb(async (db) => {
    const repo = new SurrealDocumentsRepo(db);
    await requireDocument(repo, docId);
    const updateBytes = decodeBase64Strict(updateB64);
    ensurePayloadLimit(updateBytes.byteLength, { maxBytes: context.maxBytes ?? DEFAULT_CRDT_PUSH_LIMIT_BYTES, context: "crdt_push" });

    const doc = new Y.Doc();
    const current = await readCurrentCrdt(db, docId);
    if (current) {
      Y.applyUpdate(doc, decodeBase64Strict(current), "scio:server");
    }
    Y.applyUpdate(doc, updateBytes, "scio:client");
    const encoded = encodeBase64(Y.encodeStateAsUpdate(doc));

    await exec(db,
      "UPDATE type::thing($id) SET crdt_b64 = $payload, updated_at = time::now(), updated_by = type::thing($user)",
      {
        id: ensureThing("documents", docId),
        payload: encoded,
        user: ensureThing("users", context.userId),
      },
    );

    emitServerMetric({
      event: "crdt_push",
      docId,
      userId: context.userId,
      bytes: updateBytes.byteLength,
    });

    return { ts: new Date().toISOString(), mergedBytes: updateBytes.byteLength };
  });
}

export async function diffCrdtState(
  docId: string,
  stateVectorB64: string,
  options?: { maxBytes?: number },
): Promise<{ updateB64: string | null; ts: string }>
{  return withDb(async (db) => {
    const repo = new SurrealDocumentsRepo(db);
    await requireDocument(repo, docId);
    const doc = new Y.Doc();
    const current = await readCurrentCrdt(db, docId);
    if (current) {
      Y.applyUpdate(doc, decodeBase64Strict(current), "scio:server");
    }
    const vectorBytes = decodeBase64Strict(stateVectorB64);
    ensurePayloadLimit(vectorBytes.byteLength, { maxBytes: options?.maxBytes ?? DEFAULT_CRDT_PULL_LIMIT_BYTES, context: "crdt_pull_vector" });
    const update = Y.encodeStateAsUpdate(doc, Y.decodeStateVector(vectorBytes));
    ensurePayloadLimit(update.byteLength, { maxBytes: options?.maxBytes ?? DEFAULT_CRDT_PULL_LIMIT_BYTES, context: "crdt_pull" });
    const encoded = update.length > 0 ? encodeBase64(update) : null;
    emitServerMetric({ event: "crdt_pull", docId, bytes: update.length });
    return { updateB64: encoded, ts: new Date().toISOString() };
  });
}

async function persistSnapshotIntoCrdt(
  db: SurrealClient,
  docId: string,
  crdtB64: string | null,
  snapshot: SerializedEditorState,
  userId: string,
): Promise<string> {
  const doc = new Y.Doc();
  if (crdtB64) {
    try {
      Y.applyUpdate(doc, decodeBase64Strict(crdtB64), "scio:server");
    } catch {
      // ignore corrupt state; we will replace with new snapshot below
    }
  }
  writeSnapshotToDoc(doc, snapshot);
  const encoded = encodeBase64(Y.encodeStateAsUpdate(doc));
  await exec(db,
    "UPDATE type::thing($id) SET crdt_b64 = $payload, updated_by = type::thing($user)",
    {
      id: ensureThing("documents", docId),
      payload: encoded,
      user: ensureThing("users", userId),
    },
  );
  return encoded;
}

async function createRevisionRecord(db: SurrealClient, docId: string, userId: string, note: string | null): Promise<void> {
  await exec(db,
    "CREATE document_revisions SET document_id = type::thing($doc), summary = '', note = $note, diff_meta = {}, author_id = type::thing($author)",
    {
      doc: ensureThing("documents", docId),
      note,
      author: ensureThing("users", userId),
    },
  );
}

async function readCurrentCrdt(db: SurrealClient, docId: string): Promise<string | null> {
  const rows = await exec<Array<{ result?: Array<{ crdt_b64?: string }> }>>(db,
    "SELECT crdt_b64 FROM type::thing($id) LIMIT 1",
    { id: ensureThing("documents", docId) },
  );
  const entry = rows.at(-1)?.result?.[0];
  return entry?.crdt_b64 ?? null;
}

async function requireDocument(repo: SurrealDocumentsRepo, docId: string): Promise<Document> {
  const doc = await repo.get(docId);
  if (!doc) {
    throw new DocumentError("Document not found", 404, "doc_not_found");
  }
  return doc;
}

function sanitizeExistingTags(tags: string[] | null | undefined): string[] {
  try {
    return enforceTagPolicy({ tags: tags ?? [] });
  } catch {
    return [];
  }
}

function normalizeTitle(input: unknown): string {
  if (typeof input !== "string") {
    throw new DocumentError("Title is required", 400, "invalid_title");
  }
  const trimmed = input.trim();
  if (!trimmed) {
    throw new DocumentError("Title cannot be empty", 400, "invalid_title");
  }
  if (trimmed.length > 160) {
    throw new DocumentError("Title is too long", 400, "invalid_title");
  }
  return trimmed;
}

function normalizeNote(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new DocumentError("Note must be a string", 400, "invalid_note");
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > 500) {
    throw new DocumentError("Note is too long", 400, "invalid_note");
  }
  return trimmed;
}

function decodeBase64Strict(value: string): Uint8Array {
  try {
    return decodeBase64(value);
  } catch {
    throw new PolicyError("Invalid base64 payload", 400, "invalid_payload");
  }
}

const ensureThing = (table: string, id: string): string => (id.includes(":") ? id : `${table}:${id}`);

async function withDb<T>(handler: (db: SurrealClient) => Promise<T>): Promise<T> {
  const db = await connect();
  try {
    return await handler(db);
  } finally {
    await safeClose(db);
  }
}

async function safeClose(db: SurrealClient): Promise<void> {
  if (typeof db.close === "function") {
    await db.close();
  }
}
