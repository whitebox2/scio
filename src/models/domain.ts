export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  ssh_keys?: Array<{ public_key: string; label?: string; enabled?: boolean }>;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  name: string;
  visibility: "private" | "team" | string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Folder {
  id: string;
  project_id: string;
  parent_id?: string;
  name: string;
  path: string;
  created_at?: string;
  updated_at?: string;
}

export interface FileRec {
  id: string;
  project_id: string;
  folder_id: string;
  name: string;
  content_type: string;
  size: number;
  storage_key: string;
  created_at?: string;
  updated_at?: string;
}

import type { SerializedEditorState } from "lexical";

export interface Document {
  id: string;
  project_id: string;
  folder_id?: string;
  title: string;
  body_rich: SerializedEditorState | null;
  is_bundle: boolean;
  toc?: unknown[];
  tags: string[];
  crdt_b64?: string | null;
  created_at?: string;
  updated_at?: string;
  updated_by?: string | null;
}

export interface Revision {
  id: string;
  document_id: string;
  summary: string;
  note?: string;
  diff_meta?: Record<string, unknown>;
  created_at: string;
  author_id: string;
}

export interface ShareLink {
  id: string;
  resource_type: "project" | "folder" | "file" | "document" | string;
  resource_id: string;
  url_id: string;
  created_at?: string;
  expires_at?: string | null;
}
