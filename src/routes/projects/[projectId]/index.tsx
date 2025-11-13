
import { $, component$, useComputed$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { routeLoader$, useNavigate } from "@builder.io/qwik-city";
import ItemRow from "~/components/files/ItemRow";
import LeftRail from "~/components/layout/LeftRail";
import Breadcrumbs, { type BreadcrumbSegment } from "~/components/layout/Breadcrumbs";
import type { ProjectFolderNode, ProjectSearchEntry, ProjectSummary, ProjectTreePayload } from "~/models/repo";
import { requireAuth } from "~/server/guards";
import { buildBreadcrumbSegments, extractPathFromHref, flattenTree } from "../navigation";
import {
  ProjectContentError,
  listProjectTree,
  listProjects,
} from "~/server/search";

const ROW_HEIGHT = 72;

interface ProjectBrowserLoader {
  projects: ProjectSummary[];
  projectId: string;
  tree: ProjectTreePayload;
}

interface TreeApiResponse {
  ok: boolean;
  tree?: ProjectTreePayload;
  error?: string;
}

interface SearchApiResponse {
  ok: boolean;
  results?: ProjectSearchEntry[];
  error?: string;
}

export const useProjectBrowser = routeLoader$(async (ev) => {
  const session = await requireAuth(ev);
  const projectId = ev.params.projectId;
  if (!projectId) {
    throw new ProjectContentError("projectId is required", 400, "invalid_projectId");
  }
  try {
    const [projects, tree] = await Promise.all([
      listProjects({ ownerId: session.userId }),
      listProjectTree({ projectId, path: ev.url.searchParams.get("path") }),
    ]);
    return { projects, projectId, tree } satisfies ProjectBrowserLoader;
  } catch (error) {
    if (error instanceof ProjectContentError) {
      ev.status(error.status);
    }
    throw error;
  }
});

export default component$(() => {
  const data = useProjectBrowser();
  const navigate = useNavigate();
  const listRef = useSignal<HTMLDivElement>();

  const state = useStore({
    projectId: data.value.projectId,
    currentTree: data.value.tree,
    rows: flattenTree(data.value.tree),
    path: data.value.tree.path,
    mode: "tree" as "tree" | "search",
    loading: false,
    message: "",
    messageVariant: "info" as "info" | "error" | "success",
    searchQuery: "",
    scrollTop: 0,
    viewportHeight: 600,
  });

  const breadcrumbs = useComputed$(() => buildBreadcrumbSegments(state.projectId, state.path));

  const virtualRows = useComputed$(() => {
    const total = state.rows.length;
    const viewport = state.viewportHeight || 600;
    const start = Math.max(Math.floor(state.scrollTop / ROW_HEIGHT) - 5, 0);
    const visibleCount = Math.ceil(viewport / ROW_HEIGHT) + 10;
    const end = Math.min(start + visibleCount, total);
    const offset = start * ROW_HEIGHT;
    const paddingBottom = Math.max(total * ROW_HEIGHT - offset - (end - start) * ROW_HEIGHT, 0);
    return {
      offset,
      paddingBottom,
      items: state.rows.slice(start, end),
    };
  });

  useVisibleTask$(({ cleanup }) => {
    const update = () => {
      const el = listRef.value;
      if (el) {
        state.viewportHeight = el.clientHeight;
      }
    };
    update();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", update);
      cleanup(() => window.removeEventListener("resize", update));
    }
  });

  const openPath$ = $(async (targetPath: string) => {
    state.loading = true;
    clearMessage(state);
    try {
      const response = await fetch(
        `/projects/${state.projectId}/api/tree?path=${encodeURIComponent(targetPath)}`,
        { credentials: "include" },
      );
      const payload = (await response.json()) as TreeApiResponse;
      if (!response.ok || !payload.ok || !payload.tree) {
        throw new Error(payload.error ?? "Failed to load directory");
      }
      state.currentTree = payload.tree;
      state.rows = flattenTree(payload.tree);
      state.path = payload.tree.path;
      state.mode = "tree";
      resetScroll(listRef, state);
      await navigate(`/projects/${state.projectId}?path=${encodeURIComponent(payload.tree.path)}`);
    } catch (error) {
      setMessage(state, error instanceof Error ? error.message : "Unable to load directory", "error");
    } finally {
      state.loading = false;
    }
  });

  const handleBreadcrumbNavigate$ = $(async (segment: BreadcrumbSegment) => {
    const nextPath = extractPathFromHref(segment.path);
    await openPath$(nextPath);
  });

  const handleFolderOpen$ = $(async (folder: ProjectFolderNode) => {
    await openPath$(folder.path);
  });

  const performSearch$ = $(async () => {
    if (!state.searchQuery.trim()) {
      return;
    }
    state.loading = true;
    clearMessage(state);
    try {
      const response = await fetch(
        `/projects/${state.projectId}/api/search?q=${encodeURIComponent(state.searchQuery.trim())}`,
        { credentials: "include" },
      );
      const payload = (await response.json()) as SearchApiResponse;
      if (!response.ok || !payload.ok || !payload.results) {
        throw new Error(payload.error ?? "Search failed");
      }
      state.rows = payload.results;
      state.mode = "search";
      resetScroll(listRef, state);
      setMessage(state, `${payload.results.length} result${payload.results.length === 1 ? "" : "s"} found`, "info");
    } catch (error) {
      setMessage(state, error instanceof Error ? error.message : "Search failed", "error");
    } finally {
      state.loading = false;
    }
  });

  const clearSearch$ = $(async () => {
    state.mode = "tree";
    state.rows = flattenTree(state.currentTree);
    state.searchQuery = "";
    clearMessage(state);
    resetScroll(listRef, state);
  });

  const handleCopySuccess$ = $(async () => {
    setMessage(state, "Resource URL copied", "success");
  });

  return (
    <div class="flex min-h-screen bg-white">
      <LeftRail projects={data.value.projects} activeProjectId={state.projectId} />
      <main class="flex flex-1 flex-col">
        <header class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <Breadcrumbs segments={breadcrumbs.value} onNavigate$={handleBreadcrumbNavigate$} />
          <form
            preventdefault:submit
            class="flex items-center gap-2"
            onSubmit$={performSearch$}
          >
            <input
              type="search"
              placeholder="Search documents"
              value={state.searchQuery}
              class="w-64 rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              onInput$={(_, elm) => {
                state.searchQuery = elm.value;
              }}
            />
            <button
              type="submit"
              class="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              disabled={state.loading}
            >
              Search
            </button>
            {state.mode === "search" && (
              <button
                type="button"
                class="rounded border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-slate-400"
                onClick$={clearSearch$}
              >
                Clear
              </button>
            )}
          </form>
        </header>
        {state.message && (
          <div class={`mx-6 mt-3 rounded border px-3 py-2 text-sm ${messageTone(state.messageVariant)}`}>
            {state.message}
          </div>
        )}
        <div class="flex-1 overflow-hidden">
          <div
            ref={listRef}
            class="h-full overflow-y-auto"
            onScroll$={(event) => {
              const target = event.target as HTMLDivElement;
              state.scrollTop = target.scrollTop;
              state.viewportHeight = target.clientHeight;
            }}
          >
            <div
              style={`padding-top:${virtualRows.value.offset}px;padding-bottom:${virtualRows.value.paddingBottom}px;`}
              aria-busy={state.loading}
            >
              {virtualRows.value.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  projectId={state.projectId}
                  mode={state.mode}
                  onOpen$={item.type === "folder" ? handleFolderOpen$ : undefined}
                  onCopy$={handleCopySuccess$}
                />
              ))}
              {virtualRows.value.items.length === 0 && !state.loading && (
                <p class="px-6 py-10 text-center text-sm text-slate-500">No items to display.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

const resetScroll = (ref: { value?: HTMLDivElement }, state: { scrollTop: number }) => {
  state.scrollTop = 0;
  if (ref.value) {
    ref.value.scrollTop = 0;
  }
};

const setMessage = (
  state: { message: string; messageVariant: "info" | "error" | "success" },
  text: string,
  variant: "info" | "error" | "success",
) => {
  state.message = text;
  state.messageVariant = variant;
};

const clearMessage = (state: { message: string }) => {
  state.message = "";
};

const messageTone = (variant: "info" | "error" | "success"): string => {
  switch (variant) {
    case "error":
      return "border-red-200 bg-red-50 text-red-700";
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};
