import { $, component$, useComputed$, useSignal, type PropFunction } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import type { ProjectSummary } from "~/models/repo";

interface LeftRailProps {
  projects: ProjectSummary[];
  activeProjectId?: string;
  basePath?: string;
  onSelect$?: PropFunction<(projectId: string) => void>;
}

export const LeftRail = component$<LeftRailProps>(
  ({ projects, activeProjectId, basePath = "/projects", onSelect$ }) => {
    const focusedId = useSignal<string | undefined>(activeProjectId ?? projects[0]?.id);

    const indexedProjects = useComputed$(() =>
      projects.map((project, index) => ({ project, index })),
    );

    const handleSelect$ = $(async (projectId: string) => {
      if (onSelect$) {
        await onSelect$(projectId);
      }
    });

    const moveFocus$ = $(async (direction: 1 | -1) => {
      const entries = indexedProjects.value;
      if (entries.length === 0) {
        return;
      }
      const currentIndex = entries.find((entry) => entry.project.id === focusedId.value)?.index ?? 0;
      let nextIndex = currentIndex + direction;
      if (nextIndex < 0) {
        nextIndex = entries.length - 1;
      } else if (nextIndex >= entries.length) {
        nextIndex = 0;
      }
      const nextId = entries[nextIndex]?.project.id;
      focusedId.value = nextId;
      const nextElement = document.getElementById(optionDomId(nextId));
      nextElement?.focus();
    });

    return (
      <aside class="w-64 border-r border-slate-200 bg-white">
        <div class="px-4 py-3">
          <p class="text-xs uppercase tracking-wide text-slate-500">Projects</p>
        </div>
        <div
          role="listbox"
          aria-activedescendant={focusedId.value ? optionDomId(focusedId.value) : undefined}
          tabIndex={0}
          class="flex h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto px-2 pb-4"
          onKeyDown$={async (event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              await moveFocus$(1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              await moveFocus$(-1);
            } else if (event.key === "Enter" && focusedId.value) {
              event.preventDefault();
              const target = document.getElementById(optionDomId(focusedId.value));
              target?.click();
            }
          }}
        >
          {projects.map((project) => {
            const isActive = project.id === activeProjectId;
            return (
              <Link
                key={project.id}
                id={optionDomId(project.id)}
                role="option"
                aria-selected={isActive}
                class={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-400 ${isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                href={`${basePath}/${encodeURIComponent(project.id)}`}
                onClick$={async () => {
                  await handleSelect$(project.id);
                }}
                onFocus$={() => {
                  focusedId.value = project.id;
                }}
              >
                <div class="font-medium leading-tight">{project.name}</div>
                <div class="text-xs text-slate-500">{project.visibility === "team" ? "All-team" : "Personal"}</div>
              </Link>
            );
          })}
        </div>
      </aside>
    );
  },
);

const optionDomId = (id: string | undefined): string => (id ? `project-option-${id}` : "");

export default LeftRail;
