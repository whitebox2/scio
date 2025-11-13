import { $, component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { Link, type DocumentHead, routeLoader$ } from "@builder.io/qwik-city";
import type { SerializedEditorState } from "lexical";
import { DocumentError, getDocumentForEditor, type DocumentEditorPayload } from "~/server/documents";
import { requireAuth } from "~/server/guards";
import LexicalEditor from "~/components/editor/LexicalEditor";
import YjsProvider from "~/components/editor/YjsProvider";
import { enforceTagList, TagValidationError } from "~/utils/tags";

interface EditorLoaderData {
  document: DocumentEditorPayload;
  user: { userId: string; username?: string };
}

export const useDocumentEditor = routeLoader$(async (ev) => {
  const session = await requireAuth(ev);
  const docId = ev.params.docId;
  if (!docId) {
    throw new DocumentError("docId is required", 400, "invalid_doc_id");
  }
  try {
    const document = await getDocumentForEditor(docId);
    return { document, user: session } satisfies EditorLoaderData;
  } catch (error) {
    if (error instanceof DocumentError) {
      ev.status(error.status);
    }
    throw error;
  }
});

export default component$(() => {
  const data = useDocumentEditor();
  const doc = data.value.document;
  const latestSnapshot = useStore<{ state: SerializedEditorState }>({ state: doc.snapshot });
  const meta = useStore({
    title: doc.title,
    tags: [...doc.tags],
    draftTag: "",
    note: "",
    error: "",
    message: "",
  });
  const isClient = useSignal(false);

  const updateSnapshot$ = $((state: SerializedEditorState) => {
    latestSnapshot.state = state;
  });

  const saveDocument$ = $(async (snapshot?: SerializedEditorState) => {
    try {
      if (meta.note.length > 500) {
        throw new Error("Revision note must be 500 characters or fewer");
      }
      const normalizedTags = enforceTagList(meta.tags);
      const payload = {
        title: meta.title,
        tags: normalizedTags,
        note: meta.note.trim() ? meta.note.trim() : undefined,
        snapshot: snapshot ?? latestSnapshot.state,
      } satisfies Record<string, unknown>;
      const response = await fetch(`/documents/${doc.id}/api`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to save document");
      }
      const body = (await response.json()) as { document: DocumentEditorPayload };
      latestSnapshot.state = body.document.snapshot;
      meta.tags = [...body.document.tags];
      meta.message = "Saved";
      meta.error = "";
    } catch (error) {
      meta.error = error instanceof Error ? error.message : "Unable to save";
      meta.message = "";
    }
  });

  const handleAddTag$ = $(() => {
    if (!meta.draftTag.trim()) {
      return;
    }
    try {
      const next = enforceTagList([...meta.tags, meta.draftTag.trim()]);
      meta.tags = [...next];
      meta.draftTag = "";
      meta.error = "";
    } catch (error) {
      if (error instanceof TagValidationError) {
        meta.error = "Invalid tag";
      }
    }
  });

  const handleRemoveTag$ = $((tag: string) => {
    meta.tags = meta.tags.filter((value) => value !== tag);
  });

  useVisibleTask$(({ cleanup }) => {
    isClient.value = true;
    const handleBeforeUnload = () => {
      void saveDocument$(latestSnapshot.state);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    cleanup(() => window.removeEventListener("beforeunload", handleBeforeUnload));
  });

  return (
    <main class="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold uppercase tracking-widest text-slate-400" htmlFor="doc-title">
            Title
          </label>
          <input
            id="doc-title"
            type="text"
            class="w-full max-w-xl rounded-md border border-slate-300 px-3 py-2 text-lg font-semibold text-slate-900 focus:border-slate-500 focus:outline-none"
            value={meta.title}
            onInput$={(_, el) => {
              meta.title = el.value;
            }}
          />
        </div>
        <div class="flex gap-3">
          <Link
            href={`/documents/${doc.id}`}
            class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View
          </Link>
          <button
            type="button"
            class="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
            onClick$={() => saveDocument$(latestSnapshot.state)}
          >
            Save
          </button>
        </div>
      </div>
      <section class="grid gap-6 md:grid-cols-[320px,1fr]">
        <div class="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p class="text-sm font-medium text-slate-700">Tags</p>
            <div class="mt-2 flex flex-wrap gap-2">
              {meta.tags.map((tag) => (
                <span key={tag} class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                  #{tag}
                  <button
                    type="button"
                    class="text-xs text-slate-500 hover:text-slate-800"
                    aria-label={`Remove ${tag}`}
                    onClick$={() => handleRemoveTag$(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div class="mt-3 flex gap-2">
              <input
                type="text"
                value={meta.draftTag}
                placeholder="Add tag"
                class="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                onKeyDown$={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleAddTag$();
                  }
                }}
                onInput$={(_, el) => {
                  meta.draftTag = el.value;
                }}
              />
              <button
                type="button"
                class="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                onClick$={() => handleAddTag$()}
              >
                Add
              </button>
            </div>
            <p class="mt-1 text-xs text-slate-400">Tags must start with lowercase letters and stay under the policy limit.</p>
          </div>
          <div>
            <label htmlFor="revision-note" class="text-sm font-medium text-slate-700">
              Revision note
            </label>
            <textarea
              id="revision-note"
              class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              rows={3}
              value={meta.note}
              onInput$={(_, el) => {
                meta.note = el.value;
              }}
              placeholder="Optional summary for this revision"
            />
          </div>
          {meta.message && <p class="text-sm text-emerald-600">{meta.message}</p>}
          {meta.error && <p class="text-sm text-rose-600">{meta.error}</p>}
        </div>
        <div class="flex flex-col gap-4">
          {isClient.value ? (
            <YjsProvider
              docId={doc.id}
              initialUpdateB64={doc.crdtB64}
              pullUrl={`/documents/${doc.id}/api/pull`}
              pushUrl={`/documents/${doc.id}/api/push`}
              snapshot={doc.snapshot}
              userName={data.value.user.username}
            >
              <LexicalEditor
                docId={doc.id}
                initialState={doc.snapshot}
                onStateChange$={updateSnapshot$}
                onSave$={$((state) => saveDocument$(state))}
              />
            </YjsProvider>
          ) : (
            <div class="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              Initializing editor…
            </div>
          )}
        </div>
      </section>
    </main>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(useDocumentEditor);
  return {
    title: `${data.document.title} • Edit`,
  };
};
