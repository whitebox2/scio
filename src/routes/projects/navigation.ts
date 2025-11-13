import type { BreadcrumbSegment } from "~/components/layout/Breadcrumbs";
import type { ProjectItem } from "~/components/files/ItemRow";
import type { ProjectTreePayload } from "~/models/repo";

export const buildBreadcrumbSegments = (projectId: string, path: string): BreadcrumbSegment[] => {
  const segments: BreadcrumbSegment[] = [
    { label: "Root", path: `/projects/${projectId}?path=%2F`, isCurrent: path === "/" },
  ];
  if (path === "/") {
    return segments;
  }
  const parts = path.split("/").filter(Boolean);
  let current = "";
  parts.forEach((part, index) => {
    current = `${current}/${part}`;
    segments.push({
      label: decodeURIComponent(part),
      path: `/projects/${projectId}?path=${encodeURIComponent(current)}`,
      isCurrent: index === parts.length - 1,
    });
  });
  return segments;
};

export const flattenTree = (tree: ProjectTreePayload): ProjectItem[] => {
  const byName = <T extends { name: string }>(list: T[]) => [...list].sort((a, b) => a.name.localeCompare(b.name));
  return [...byName(tree.folders), ...byName(tree.files), ...byName(tree.documents)];
};

export const extractPathFromHref = (href: string): string => {
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const url = new URL(href, base);
    return url.searchParams.get("path") ?? "/";
  } catch {
    return "/";
  }
};
