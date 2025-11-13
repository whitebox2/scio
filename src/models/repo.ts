import type { Document } from "./domain";

export interface ProjectSummary {
  id: string;
  name: string;
  visibility: string;
  updated_at?: string;
  owner_id?: string;
}

export interface RepoFolderRecord {
  id: string;
  name: string;
  path: string;
  parent_id?: string | null;
  updated_at?: string;
  updated_by?: string | null;
  child_folder_count?: number;
  child_file_count?: number;
}

export interface RepoFileRecord {
  id: string;
  name: string;
  folder_id?: string | null;
  size: number;
  updated_at?: string;
  updated_by?: string | null;
  content_type?: string;
  storage_key?: string;
}

export interface RepoDocumentRecord {
  id: string;
  title: string;
  folder_id?: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

export interface ProjectTreeRecord {
  currentFolder: RepoFolderRecord | null;
  folders: RepoFolderRecord[];
  files: RepoFileRecord[];
  documents: RepoDocumentRecord[];
  missing?: boolean;
}

export interface ProjectsRepo {
  listProjects(ownerId: string): Promise<ProjectSummary[]>;
  getTree(projectId: string, path: string): Promise<ProjectTreeRecord>;
}

export interface DocumentsRepo {
  get(id: string): Promise<Document | null>;
  create(input: Partial<Document>): Promise<string>;
  update(id: string, patch: Partial<Document>): Promise<void>;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
}

export interface SearchRepo {
  search(projectId: string, q: string, limit: number): Promise<SearchResult[]>;
}

export type ProjectResourceType = "folder" | "file" | "document";

export interface ProjectResourceBase {
  id: string;
  urlId: string;
  name: string;
  path: string;
  type: ProjectResourceType;
  updatedAt?: string;
  updatedBy?: string | null;
}

export interface ProjectFolderNode extends ProjectResourceBase {
  type: "folder";
  childFolderCount: number;
  childFileCount: number;
}

export interface ProjectFileNode extends ProjectResourceBase {
  type: "file";
  size: number;
  contentType?: string;
}

export interface ProjectDocumentNode extends ProjectResourceBase {
  type: "document";
  snippet?: string;
}

export interface ProjectTreePayload {
  path: string;
  folders: ProjectFolderNode[];
  files: ProjectFileNode[];
  documents: ProjectDocumentNode[];
}

export interface ProjectSearchEntry extends ProjectDocumentNode {
  snippet: string;
}

const MIN_NGRAM = 3;
const MAX_NGRAM = 6;

const toPlainBody = (body: unknown): string =>
  typeof body === "string" ? body : JSON.stringify(body ?? "");

export const normalizeSearchQuery = (query: string): string =>
  query.normalize("NFKC").toLocaleLowerCase("en-US");

const tokenize = (value: string): string[] =>
  value
    .split(/\s+/g)
    .map((token) => token.trim())
    .filter(Boolean);

const buildNgrams = (token: string): string[] => {
  const grams: string[] = [];
  const safeToken = token.replace(/\s+/g, "");
  for (let size = MIN_NGRAM; size <= MAX_NGRAM; size += 1) {
    if (safeToken.length < size) {
      break;
    }
    for (let i = 0; i <= safeToken.length - size; i += 1) {
      grams.push(safeToken.slice(i, i + size));
    }
  }
  return grams;
};

export const composeSearchBlob = (title: string, body: unknown): string => {
  const normalizedTitle = normalizeSearchQuery(title);
  const normalizedBody = normalizeSearchQuery(toPlainBody(body));
  const aggregate = `${normalizedTitle} ${normalizedBody}`.trim();
  if (!aggregate) {
    return "";
  }

  const terms = new Set<string>();
  if (normalizedTitle) {
    terms.add(normalizedTitle);
  }

  if (normalizedBody) {
    terms.add(normalizedBody);
  }

  for (const token of tokenize(aggregate)) {
    terms.add(token);
    for (const gram of buildNgrams(token)) {
      terms.add(gram);
    }
  }

  return Array.from(terms).join(" ");
};
