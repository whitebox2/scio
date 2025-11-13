
import { $, component$, useSignal, type PropFunction } from "@builder.io/qwik";
import { Link, useNavigate } from "@builder.io/qwik-city";
import type {
  ProjectDocumentNode,
  ProjectFileNode,
  ProjectFolderNode,
  ProjectResourceBase,
} from "~/models/repo";
import RangeDownloadLink from "./RangeDownloadLink";

export type ProjectItem = ProjectFolderNode | ProjectFileNode | ProjectDocumentNode;

interface ItemRowProps {
  item: ProjectItem;
  projectId: string;
  mode: "tree" | "search";
  onOpen$?: PropFunction<(item: ProjectFolderNode) => void>;
  onCopy$?: PropFunction<(targetUrl: string) => void>;
}

export const ItemRow = component$<ItemRowProps>(({ item, projectId, mode, onOpen$, onCopy$ }) => {
  const copying = useSignal(false);
  const navigate = useNavigate();

  const handleFolderOpen$ = $(async () => {
    if (item.type !== "folder" || !onOpen$) {
      return;
    }
    await onOpen$(item);
  });

  const handleCopy$ = $(async () => {
    const url = buildResourceUrl(projectId, item);
    try {
      copying.value = true;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("input");
        input.value = url;
        document.body.append(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      if (onCopy$) {
        await onCopy$(url);
      }
    } finally {
      copying.value = false;
    }
  });

  const secondaryMeta = item.type === "folder"
    ? `${item.childFolderCount} folders · ${item.childFileCount} files`
    : item.type === "file"
      ? formatSize(item.size)
      : undefined;

  return (
    <div class="flex items-center gap-4 border-b border-slate-100 px-3 py-4 text-sm" role="row">
      <div class="w-6 text-lg" aria-hidden="true">
        {item.type === "folder" && "🗂"}
        {item.type === "file" && "📄"}
        {item.type === "document" && "📑"}
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <div class="flex flex-wrap items-center gap-3">
          {item.type === "folder" ? (
            <button
              type="button"
              class="truncate text-left font-medium text-slate-900 hover:underline"
              onClick$={handleFolderOpen$}
            >
              {item.name}
            </button>
          ) : (
            <Link
              href={buildResourceUrl(projectId, item)}
              class="truncate font-medium text-slate-900 hover:underline"
              onClick$={(event) => {
                if (item.type === "document") {
                  event.preventDefault();
                  navigate(`${buildResourceUrl(projectId, item)}/edit`);
                }
              }}
            >
              {item.name}
            </Link>
          )}
          {secondaryMeta && <span class="text-xs text-slate-500">{secondaryMeta}</span>}
          {mode === "search" && item.type === "document" && item.snippet && (
            <span class="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Search match</span>
          )}
        </div>
        {mode === "search" && item.type === "document" && item.snippet && (
          <p class="line-clamp-2 text-xs text-slate-500" dangerouslySetInnerHTML={item.snippet}></p>
        )}
        <div class="flex flex-wrap gap-4 text-xs text-slate-500">
          <span>Updated: {item.updatedAt ?? "—"}</span>
          <span>By: {item.updatedBy ?? "—"}</span>
          <span class="truncate">Path: {item.path}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        {item.type === "file" && (
          <RangeDownloadLink
            href={`/projects/${projectId}/files/${item.urlId}/download`}
            filename={item.name}
            label="Download"
          />
        )}
        <button
          type="button"
          class="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-slate-400"
          disabled={copying.value}
          onClick$={handleCopy$}
        >
          {copying.value ? "Copied" : "Copy URL"}
        </button>
        <Link
          preventdefault:click
          href={`${buildResourceUrl(projectId, item)}/edit`}
          class="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-slate-400"
          onClick$={async () => {
            await navigate(`${buildResourceUrl(projectId, item)}/edit`);
          }}
        >
          Edit
        </Link>
        <Link
          preventdefault:click
          href={`${buildResourceUrl(projectId, item)}/history`}
          class="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-slate-400"
          onClick$={async () => {
            await navigate(`${buildResourceUrl(projectId, item)}/history`);
          }}
        >
          History
        </Link>
      </div>
    </div>
  );
});

const buildResourceUrl = (projectId: string, item: ProjectResourceBase): string => {
  const base = `/projects/${projectId}`;
  if (item.type === "folder") {
    const params = new URLSearchParams({ path: item.path });
    return `${base}?${params.toString()}`;
  }
  if (item.type === "file") {
    return `${base}/files/${item.urlId}`;
  }
  return `${base}/documents/${item.urlId}`;
};

const formatSize = (size: number): string => {
  if (!Number.isFinite(size)) {
    return "—";
  }
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${size} B`;
};

export default ItemRow;
