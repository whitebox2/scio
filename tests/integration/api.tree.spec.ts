
import { beforeEach, describe, expect, it } from "vitest";
import type { ProjectSummary, ProjectTreeRecord, ProjectsRepo } from "~/models/repo";
import { listProjectTree, normalizeProjectPath, ProjectContentError } from "~/server/search";

describe("project tree service", () => {
  beforeEach(() => {
    process.env.SCIO_URL_ID_SECRET = "test-secret-12345";
  });

  it("normalizes folder paths and prevents traversal", () => {
    expect(normalizeProjectPath("//docs///notes/../design")).toBe("/docs/design");
    expect(() => normalizeProjectPath("../../etc/passwd")).toThrow(ProjectContentError);
  });

  it("returns typed nodes with url-safe ids", async () => {
    const repo = new StubProjectsRepo({
      "/": {
        currentFolder: null,
        folders: [
          {
            id: "folders:alpha",
            name: "Alpha",
            path: "/Alpha",
            child_folder_count: 2,
            child_file_count: 1,
            updated_at: "2025-11-10T10:00:00Z",
            updated_by: "users:1",
          },
        ],
        files: [
          {
            id: "files:file1",
            name: "Readme.md",
            size: 2048,
            folder_id: null,
            updated_at: "2025-11-11T09:00:00Z",
            updated_by: "users:2",
          },
        ],
        documents: [
          {
            id: "documents:doc1",
            title: "Welcome",
            folder_id: null,
            updated_at: "2025-11-09T08:00:00Z",
          },
        ],
        missing: false,
      },
    });

    const tree = await listProjectTree({ projectId: "projects/demo", path: "/", repo });
    expect(tree.path).toBe("/");
    expect(tree.folders[0]?.urlId).toHaveLength(12);
    expect(tree.files[0]?.type).toBe("file");
    expect(tree.documents[0]?.type).toBe("document");
  });

  it("throws when requesting a missing folder", async () => {
    const repo = new StubProjectsRepo({
      "/": { currentFolder: null, folders: [], files: [], documents: [], missing: false },
    });
    await expect(listProjectTree({ projectId: "projects/demo", path: "/missing", repo }))
      .rejects.toMatchObject({ code: "path_not_found" });
  });
});

class StubProjectsRepo implements ProjectsRepo {
  constructor(private readonly trees: Record<string, ProjectTreeRecord>) {}

  async listProjects(): Promise<ProjectSummary[]> {
    return [];
  }

  async getTree(_: string, path: string): Promise<ProjectTreeRecord> {
    const tree = this.trees[path];
    if (!tree) {
      return { currentFolder: null, folders: [], files: [], documents: [], missing: true } satisfies ProjectTreeRecord;
    }
    return tree;
  }
}
