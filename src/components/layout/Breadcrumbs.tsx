import { $, component$, type PropFunction } from "@builder.io/qwik";
import { Link, useNavigate } from "@builder.io/qwik-city";

export interface BreadcrumbSegment {
  label: string;
  path: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
  onNavigate$?: PropFunction<(segment: BreadcrumbSegment) => void>;
}

export const Breadcrumbs = component$<BreadcrumbsProps>(({ segments, onNavigate$ }) => {
  const navigate = useNavigate();

  const handleClick$ = $(async (segment: BreadcrumbSegment) => {
    if (onNavigate$) {
      await onNavigate$(segment);
      return;
    }
    await navigate(segment.path);
  });

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" class="flex items-center text-sm text-slate-500">
      <ol class="flex flex-wrap items-center gap-2">
        {segments.map((segment, index) => (
          <li key={segment.path} class="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            <Link
              preventdefault:click
              data-segment
              href={segment.path}
              aria-current={segment.isCurrent ? "page" : undefined}
              class={`rounded px-1 py-0.5 transition-colors ${segment.isCurrent ? "text-slate-900 font-medium" : "hover:text-slate-900"}`}
              onClick$={() => handleClick$(segment)}
            >
              {segment.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
});

export default Breadcrumbs;
