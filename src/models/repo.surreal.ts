import type { SurrealClient } from "~/adapters/db.surreal";
import type {
  DocumentsRepo,
  ProjectSummary,
  ProjectsRepo,
  RepoDocumentRecord,
  RepoFileRecord,
  RepoFolderRecord,
  SearchRepo,
  SearchResult,
  ProjectTreeRecord,
} from "./repo";
import type { Document } from "./domain";
import { normalizeSearchQuery } from "./repo";

const ensureThing = (table: string, value: string): string =>
  value.includes(":") ? value : `${table}:${value}`;

const firstResult = <T>(rows: unknown): T | null => {
  if (!Array.isArray(rows)) {
    return null;
  }
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const entry = rows[i];
    if (Array.isArray(entry?.result) && entry.result.length > 0) {
      return entry.result[0] as T;
    }
  }
  return null;
};

const mapResult = <T>(rows: unknown): T[] => {
  if (!Array.isArray(rows)) {
    return [];
  }
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const entry = rows[i];
    if (Array.isArray(entry?.result)) {
      return entry.result as T[];
    }
  }
  return [];
};

export class SurrealDocumentsRepo implements DocumentsRepo {
  constructor(private readonly db: SurrealClient) {}

  async get(id: string): Promise<Document | null> {
    const docId = ensureThing("documents", id);
    const result = await this.db.query(
      "SELECT * FROM type::thing($id) LIMIT 1",
      { id: docId },
    );
    return firstResult<Document>(result);
  }

  async create(input: Partial<Document>): Promise<string> {
    const result = await this.db.query(
      "CREATE documents CONTENT $doc RETURN id",
      { doc: input },
    );
    const row = firstResult<{ id: string }>(result);
    if (!row?.id) {
      throw new Error("Failed to create document");
    }
    return row.id;
  }

  async update(id: string, patch: Partial<Document>): Promise<void> {
    const docId = ensureThing("documents", id);
    await this.db.query(
      "UPDATE type::thing($id) MERGE $patch",
      { id: docId, patch },
    );
  }
}

export class SurrealProjectsRepo implements ProjectsRepo {
  constructor(private readonly db: SurrealClient) {}

  async listProjects(ownerId: string): Promise<ProjectSummary[]> {
    const ownerRef = ensureThing("users", ownerId);
    const result = await this.db.query(
      `
      SELECT id, name, visibility, owner_id, updated_at
      FROM projects
      WHERE owner_id = type::thing($owner)
        OR visibility = 'team'
      ORDER BY visibility DESC, name
      LIMIT 50;
    `,
      { owner: ownerRef },
    );
    return mapResult<ProjectSummary>(result);
  }

  async getTree(projectId: string, path: string): Promise<ProjectTreeRecord> {
    const normalizedPath = path === "" ? "/" : path;
    const projectRef = ensureThing("projects", projectId);
    let currentFolder: RepoFolderRecord | null = null;
    if (normalizedPath !== "/") {
      const currentResult = await this.db.query(
        `
        SELECT id, name, path, parent_id, updated_at
        FROM folders
        WHERE project_id = type::thing($project)
          AND path = $path
        LIMIT 1;
      `,
        { project: projectRef, path: normalizedPath },
      );
      currentFolder = firstResult<RepoFolderRecord>(currentResult);
      if (!currentFolder) {
        return { currentFolder: null, folders: [], files: [], documents: [], missing: true } satisfies ProjectTreeRecord;
      }
    }
    const parentId = currentFolder?.id ?? null;
    const folders = await this.loadChildFolders(projectRef, normalizedPath, parentId);
    const files = await this.loadChildFiles(projectRef, normalizedPath, parentId);
    const documents = await this.loadChildDocuments(projectRef, normalizedPath, parentId);
    return {
      currentFolder,
      folders,
      files,
      documents,
      missing: false,
    } satisfies ProjectTreeRecord;
  }

  private async loadChildFolders(
    projectRef: string,
    path: string,
    parentId: string | null,
  ): Promise<RepoFolderRecord[]> {
    const result = await this.db.query(
      `
      SELECT id, name, path, parent_id, updated_at
      FROM folders
      WHERE project_id = type::thing($project)
        AND (
          ($path = '/' AND parent_id = NONE)
          OR ($path != '/' AND parent_id = $parent)
        )
      ORDER BY name;
    `,
      { project: projectRef, path, parent: parentId },
    );
    const rows = mapResult<RepoFolderRecord>(result);
    if (rows.length === 0) {
      return [];
    }
    const ids = rows.map((row) => row.id);
    const folderCounts = await this.fetchChildFolderCounts(ids);
    const fileCounts = await this.fetchChildFileCounts(ids);
    return rows.map((row) => ({
      ...row,
      child_folder_count: folderCounts.get(row.id) ?? 0,
      child_file_count: fileCounts.get(row.id) ?? 0,
    }));
  }

  private async loadChildFiles(
    projectRef: string,
    path: string,
    parentId: string | null,
  ): Promise<RepoFileRecord[]> {
    const result = await this.db.query(
      `
      SELECT id, name, folder_id, size, content_type, updated_at
      FROM files
      WHERE project_id = type::thing($project)
        AND (
          ($path = '/' AND folder_id = NONE)
          OR ($path != '/' AND folder_id = $parent)
        )
      ORDER BY name;
    `,
      { project: projectRef, path, parent: parentId },
    );
    return mapResult<RepoFileRecord>(result);
  }

  private async loadChildDocuments(
    projectRef: string,
    path: string,
    parentId: string | null,
  ): Promise<RepoDocumentRecord[]> {
    const result = await this.db.query(
      `
      SELECT id, title, folder_id, updated_at
      FROM documents
      WHERE project_id = type::thing($project)
        AND (
          ($path = '/' AND folder_id = NONE)
          OR ($path != '/' AND folder_id = $parent)
        )
      ORDER BY title;
    `,
      { project: projectRef, path, parent: parentId },
    );
    return mapResult<RepoDocumentRecord>(result);
  }

  private async fetchChildFolderCounts(ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) {
      return new Map();
    }
    const result = await this.db.query(
      `
      SELECT parent_id AS folder_id, count() AS total
      FROM folders
      WHERE parent_id IN $ids
      GROUP BY parent_id;
    `,
      { ids },
    );
    const rows = mapResult<{ folder_id: string; total: number }>(result);
    return rows.reduce((map, row) => map.set(row.folder_id, row.total ?? 0), new Map<string, number>());
  }

  private async fetchChildFileCounts(ids: string[]): Promise<Map<string, number>> {
    if (ids.length === 0) {
      return new Map();
    }
    const result = await this.db.query(
      `
      SELECT folder_id AS folder_id, count() AS total
      FROM files
      WHERE folder_id IN $ids
      GROUP BY folder_id;
    `,
      { ids },
    );
    const rows = mapResult<{ folder_id: string; total: number }>(result);
    return rows.reduce((map, row) => map.set(row.folder_id, row.total ?? 0), new Map<string, number>());
  }
}

export class SurrealSearchRepo implements SearchRepo {
  constructor(private readonly db: SurrealClient) {}

  async search(
    projectId: string,
    rawQuery: string,
    limit: number,
  ): Promise<SearchResult[]> {
    const projectRef = ensureThing("projects", projectId);
    const normalized = normalizeSearchQuery(rawQuery);
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const result = await this.db.query(
      `
      SELECT id, title,
        highlights::html(idx_documents_search) AS snippet
      FROM documents
      WHERE project_id = type::thing($project)
        AND search_blob @1@ $query
      LIMIT $limit;
    `,
      {
        project: projectRef,
        query: normalized,
        limit: safeLimit,
      },
    );
    return mapResult<SearchResult>(result);
  }
}
