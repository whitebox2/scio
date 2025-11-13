import { component$, useComputed$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import LeftRail from "~/components/layout/LeftRail";
import type { ProjectSummary } from "~/models/repo";
import { requireAuth } from "~/server/guards";
import { listProjects } from "~/server/search";

export const useProjectsData = routeLoader$(async (ev) => {
  const session = await requireAuth(ev);
  const projects = await listProjects({ ownerId: session.userId });
  return { projects } satisfies { projects: ProjectSummary[] };
});

export default component$(() => {
  const data = useProjectsData();
  const projects = data.value.projects;
  const primaryProject = useComputed$(() => projects[0]);

  return (
    <div class="flex min-h-screen bg-slate-50">
      <LeftRail projects={projects} />
      <section class="flex flex-1 flex-col items-center justify-center gap-6 p-10 text-center">
        <h1 class="text-2xl font-semibold text-slate-900">Select a project to explore its files</h1>
        {primaryProject.value ? (
          <Link
            href={`/projects/${primaryProject.value.id}`}
            class="rounded-md bg-slate-900 px-6 py-3 text-white shadow hover:bg-slate-800"
          >
            Open {primaryProject.value.name}
          </Link>
        ) : (
          <p class="text-slate-500">We couldn&apos;t find any projects for your account.</p>
        )}
      </section>
    </div>
  );
});
