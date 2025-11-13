import { describe, expect, it } from "vitest";
import type { ProjectTreePayload } from "~/models/repo";
import { buildBreadcrumbSegments, extractPathFromHref, flattenTree } from "~/routes/projects/navigation";

describe("navigation helpers", () => {
  it("builds breadcrumb segments for deep paths", () => {
    const segments = buildBreadcrumbSegments("projects:team", "/docs/design/specs");
    expect(segments).toHaveLength(4);
    expect(segments[0]?.label).toBe("Root");
    expect(segments[3]?.path).toBe(
      "/projects/projects:team?path=%2Fdocs%2Fdesign%2Fspecs",
    );
  });

  it("extracts the target folder from breadcrumb hrefs", () => {
    expect(extractPathFromHref("/projects/p1?path=%2Fdocs")).toBe("/docs");
    expect(extractPathFromHref("/projects/p1?path=%2F")).toBe("/");
  });

  it("flattens folders, files, and documents in alphabetical order", () => {
    const tree: ProjectTreePayload = {
      path: "/",
      folders: [
        { id: "folders:b", urlId: "b", name: "Beta", path: "/Beta", type: "folder", updatedAt: "", childFolderCount: 0, childFileCount: 0 },
        { id: "folders:a", urlId: "a", name: "Alpha", path: "/Alpha", type: "folder", updatedAt: "", childFolderCount: 0, childFileCount: 0 },
      ],
      files: [
        { id: "files:z", urlId: "z", name: "Zeta.md", path: "/Zeta.md", type: "file", updatedAt: "", size: 1 },
        { id: "files:h", urlId: "h", name: "Gamma.md", path: "/Gamma.md", type: "file", updatedAt: "", size: 1 },
      ],
      documents: [
        { id: "documents:r", urlId: "r", name: "Report", path: "/Report", type: "document" },
      ],
    };

    const items = flattenTree(tree);
    expect(items.map((item) => item.name)).toEqual([
      "Alpha",
      "Beta",
      "Gamma.md",
      "Zeta.md",
      "Report",
    ]);
  });
});
