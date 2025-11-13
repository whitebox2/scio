import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead, routeLoader$ } from "@builder.io/qwik-city";
import { DocumentError, getDocumentForReader } from "~/server/documents";
import { requireAuth } from "~/server/guards";

export const useDocumentReader = routeLoader$(async (ev) => {
  await requireAuth(ev);
  const docId = ev.params.docId;
  if (!docId) {
    throw new DocumentError("docId is required", 400, "invalid_doc_id");
  }
  try {
    const document = await getDocumentForReader(docId);
    return { document };
  } catch (error) {
    if (error instanceof DocumentError) {
      ev.status(error.status);
    }
    throw error;
  }
});

export default component$(() => {
  const data = useDocumentReader();
  const doc = data.value.document;
  return (
    <main class="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <header class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-4">
          <h1 class="text-3xl font-semibold text-slate-900">{doc.title}</h1>
          <Link
            href={`/documents/${doc.id}/edit`}
            class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800"
          >
            Edit
          </Link>
        </div>
        <p class="text-sm text-slate-500">
          Updated {doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : "recently"}
        </p>
        {doc.tags.length > 0 && (
          <ul class="flex flex-wrap gap-2 text-sm">
            {doc.tags.map((tag) => (
              <li key={tag} class="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </header>
      <article
        class="prose prose-slate max-w-none"
        dangerouslySetInnerHTML={doc.html}
      />
    </main>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const data = resolveValue(useDocumentReader);
  return {
    title: `${data.document.title} • Documents`,
  };
};
