import type { SurrealClient } from "~/adapters/db.surreal";
import { connect } from "~/adapters/db.surreal";
import {
  type ProjectDocumentNode,
  type ProjectFileNode,
  type ProjectFolderNode,
  type ProjectSearchEntry,
  type ProjectSummary,
  type ProjectsRepo,
  type ProjectTreePayload,
  type RepoDocumentRecord,
  type RepoFileRecord,
  type RepoFolderRecord,
  type SearchRepo,
} from "~/models/repo";
import { SurrealProjectsRepo, SurrealSearchRepo } from "~/models/repo.surreal";
import { deterministicUrlId } from "~/utils/id";

export class ProjectContentError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string) {
    super(message);
    this.name = "ProjectContentError";
  }
}

export interface ListProjectsInput {
  ownerId: string;
  repo?: ProjectsRepo;
}

export interface ListProjectTreeInput {
  projectId: string;
  path?: string | null;
  repo?: ProjectsRepo;
  urlIdSecret?: string;
}

export interface SearchProjectInput {
  projectId: string;
  query: string;
  limit?: number;
  repo?: SearchRepo;
  urlIdSecret?: string;
}

export async function listProjects(input: ListProjectsInput): Promise<ProjectSummary[]> {
  const ownerId = normalizeIdentifier(input.ownerId, "ownerId");
  return useProjectsRepo(input.repo, async (repo) => {
    const results = await repo.listProjects(ownerId);
    const seen = new Set<string>();
    return results.filter((project) => {
      if (seen.has(project.id)) {
        return false;
      }
      seen.add(project.id);
      return true;
    });
  });
}

export async function listProjectTree(input: ListProjectTreeInput): Promise<ProjectTreePayload> {
  const projectId = normalizeIdentifier(input.projectId, "projectId");
  const normalizedPath = normalizeProjectPath(input.path);
  const secret = input.urlIdSecret;
  return useProjectsRepo(input.repo, async (repo) => {
    const tree = await repo.getTree(projectId, normalizedPath);
    if (tree.missing) {
      throw new ProjectContentError("Folder not found", 404, "path_not_found");
    }
    const folders = tree.folders.map((folder) =>
      toFolderNode(folder, normalizedPath, secret),
    );
    const files = tree.files.map((file) => toFileNode(file, normalizedPath, secret));
    const documents = tree.documents.map((doc) =>
      toDocumentNode(doc, normalizedPath, secret),
    );
    return {
      path: normalizedPath,
      folders,
      files,
      documents,
    } satisfies ProjectTreePayload;
  });
}

export async function searchProject(input: SearchProjectInput): Promise<ProjectSearchEntry[]> {
  const projectId = normalizeIdentifier(input.projectId, "projectId");
  const query = input.query?.trim();
  if (!query) {
    throw new ProjectContentError("Query is required", 400, "invalid_query");
  }
  const safeLimit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const secret = input.urlIdSecret;
  return useSearchRepo(input.repo, async (repo) => {
    const results = await repo.search(projectId, query, safeLimit);
    return results.map((result) => ({
      id: result.id,
      urlId: deterministicUrlId(result.id, { secret }),
      name: result.title,
      path: `/documents/${result.id}`,
      type: "document",
      snippet: result.snippet,
      updatedAt: undefined,
      updatedBy: undefined,
    }));
  });
}

export function normalizeProjectPath(raw: string | null | undefined): string {
  if (!raw || raw.trim().length === 0) {
    return "/";
  }
  const trimmed = raw.trim();
  if (trimmed === "/") {
    return "/";
  }
  const stack: string[] = [];
  for (const segment of trimmed.split("/")) {
    if (!segment || segment === ".") {
      continue;
    }
    if (segment === "..") {
      if (stack.length === 0) {
        throw new ProjectContentError("Path traversal is not allowed", 400, "invalid_path");
      }
      stack.pop();
      continue;
    }
    if (/\0|\r|\n/u.test(segment)) {
      throw new ProjectContentError("Path contains invalid characters", 400, "invalid_path");
    }
    stack.push(segment);
  }
  return stack.length === 0 ? "/" : `/${stack.join("/")}`;
}

const normalizeIdentifier = (value: string, field: string): string => {
  if (!value || typeof value !== "string") {
    throw new ProjectContentError(`${field} is required`, 400, `invalid_${field}`);
  }
  return value;
};

const toFolderNode = (
  folder: RepoFolderRecord,
  currentPath: string,
  secret?: string,
): ProjectFolderNode => ({
  id: folder.id,
  urlId: deterministicUrlId(folder.id, { secret }),
  name: folder.name,
  path: folder.path ?? buildChildPath(currentPath, folder.name),
  type: "folder",
  updatedAt: folder.updated_at,
  updatedBy: folder.updated_by,
  childFolderCount: folder.child_folder_count ?? 0,
  childFileCount: folder.child_file_count ?? 0,
});

const toFileNode = (
  file: RepoFileRecord,
  currentPath: string,
  secret?: string,
): ProjectFileNode => ({
  id: file.id,
  urlId: deterministicUrlId(file.id, { secret }),
  name: file.name,
  path: buildChildPath(currentPath, file.name),
  type: "file",
  updatedAt: file.updated_at,
  updatedBy: file.updated_by,
  size: file.size,
  contentType: file.content_type,
});

const toDocumentNode = (
  doc: RepoDocumentRecord,
  currentPath: string,
  secret?: string,
): ProjectDocumentNode => ({
  id: doc.id,
  urlId: deterministicUrlId(doc.id, { secret }),
  name: doc.title,
  path: buildChildPath(currentPath, doc.title),
  type: "document",
  updatedAt: doc.updated_at,
  updatedBy: doc.updated_by,
});

const buildChildPath = (parentPath: string, name: string): string => {
  const base = parentPath === "/" ? "" : parentPath;
  return `${base}/${name}`.replace(/\/\/+/, "/");
};

const useProjectsRepo = async <T>(repo: ProjectsRepo | undefined, handler: (repo: ProjectsRepo) => Promise<T>): Promise<T> => {
  if (repo) {
    return handler(repo);
  }
  const db = await connect();
  try {
    const surrealRepo = new SurrealProjectsRepo(db);
    return await handler(surrealRepo);
  } finally {
    await safeClose(db);
  }
};

const useSearchRepo = async <T>(repo: SearchRepo | undefined, handler: (repo: SearchRepo) => Promise<T>): Promise<T> => {
  if (repo) {
    return handler(repo);
  }
  const db = await connect();
  try {
    const surrealRepo = new SurrealSearchRepo(db);
    return await handler(surrealRepo);
  } finally {
    await safeClose(db);
  }
};

const safeClose = async (db: SurrealClient): Promise<void> => {
  if (typeof db.close === "function") {
    await db.close();
  }
};
