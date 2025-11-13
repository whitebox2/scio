import type { SerializedEditorState, SerializedElementNode, SerializedLexicalNode, SerializedTextNode } from "lexical";
import { IS_BOLD, IS_CODE, IS_ITALIC, IS_STRIKETHROUGH, IS_UNDERLINE } from "lexical";
import type { SerializedParagraphNode, SerializedHeadingNode, SerializedQuoteNode } from "@lexical/rich-text";
import type { SerializedListNode, SerializedListItemNode } from "@lexical/list";
import type { SerializedLinkNode } from "@lexical/link";
import type { SerializedCodeNode } from "@lexical/code";
import type { SerializedTableNode, SerializedTableRowNode, SerializedTableCellNode } from "@lexical/table";
import * as Y from "yjs";
import { decodeBase64, encodeBase64 } from "./base64";

export const SNAPSHOT_MAP_KEY = "__lexical_snapshot__";
export const SNAPSHOT_STATE_FIELD = "state";
export const SNAPSHOT_TS_FIELD = "ts";

const EMPTY_PARAGRAPH: SerializedParagraphNode = {
  children: [],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "paragraph",
  version: 1,
};

const EMPTY_ROOT: SerializedElementNode = {
  children: [EMPTY_PARAGRAPH],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "root",
  version: 1,
};

export function createEmptyLexicalState(): SerializedEditorState {
  return { root: clone(EMPTY_ROOT) } satisfies SerializedEditorState;
}

const clone = <T>(value: T): T => {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

export function ensureSerializedState(value: unknown): SerializedEditorState {
  if (!isPlainObject(value)) {
    return createEmptyLexicalState();
  }
  const root = (value as SerializedEditorState).root;
  if (!isPlainObject(root) || root.type !== "root" || !Array.isArray(root.children)) {
    return createEmptyLexicalState();
  }
  return value as SerializedEditorState;
}

export function writeSnapshotToDoc(doc: Y.Doc, state: SerializedEditorState): void {
  const snapshot = doc.getMap(SNAPSHOT_MAP_KEY);
  snapshot.set(SNAPSHOT_STATE_FIELD, state);
  snapshot.set(SNAPSHOT_TS_FIELD, Date.now());
}

export function readSnapshotFromDoc(doc: Y.Doc): SerializedEditorState | null {
  const snapshot = doc.getMap(SNAPSHOT_MAP_KEY);
  const raw = snapshot.get(SNAPSHOT_STATE_FIELD);
  if (!raw) {
    return null;
  }
  return ensureSerializedState(raw);
}

export function ydocToLexicalJson(ydocB64: string | null | undefined, fallback?: SerializedEditorState | null): SerializedEditorState {
  if (!ydocB64) {
    return fallback ? ensureSerializedState(fallback) : createEmptyLexicalState();
  }
  try {
    const update = decodeBase64(ydocB64);
    const doc = new Y.Doc();
    Y.applyUpdate(doc, update);
    const snapshot = readSnapshotFromDoc(doc);
    if (snapshot) {
      return snapshot;
    }
  } catch {
    // swallow decode errors and fall back
  }
  return fallback ? ensureSerializedState(fallback) : createEmptyLexicalState();
}

export function encodeDocStateToBase64(doc: Y.Doc): string {
  return encodeBase64(Y.encodeStateAsUpdate(doc));
}

export function lexicalStateToHtml(state: SerializedEditorState): string {
  const root = ensureSerializedState(state).root;
  return renderChildren(root.children ?? []);
}

function renderChildren(children: SerializedLexicalNode[]): string {
  return children.map(renderNode).join("");
}

function renderNode(node: SerializedLexicalNode): string {
  switch (node.type) {
    case "paragraph":
      return wrap("p", renderChildren((node as SerializedParagraphNode).children ?? []));
    case "heading":
      return wrap(resolveHeadingTag(node as SerializedHeadingNode), renderChildren(node.children ?? []));
    case "quote":
      return wrap("blockquote", renderChildren((node as SerializedQuoteNode).children ?? []));
    case "list":
      return wrap(resolveListTag(node as SerializedListNode), renderChildren(node.children ?? []));
    case "listitem":
      return wrap("li", renderChildren((node as SerializedListItemNode).children ?? []));
    case "code":
      return renderCodeNode(node as SerializedCodeNode);
    case "linebreak":
      return "<br />";
    case "link":
      return renderLinkNode(node as SerializedLinkNode);
    case "table":
      return renderTableNode(node as SerializedTableNode);
    case "tablerow":
      return wrap("tr", renderChildren(node.children ?? []));
    case "tablecell":
      return renderTableCell(node as SerializedTableCellNode);
    case "text":
      return renderTextNode(node as SerializedTextNode);
    default:
      return node.children ? renderChildren(node.children) : "";
  }
}

function renderTextNode(node: SerializedTextNode): string {
  let content = escapeHtml(node.text ?? "");
  const format = typeof node.format === "number" ? node.format : 0;
  if (format & IS_CODE) {
    content = wrap("code", content);
  }
  if (format & IS_BOLD) {
    content = wrap("strong", content);
  }
  if (format & IS_ITALIC) {
    content = wrap("em", content);
  }
  if (format & IS_UNDERLINE) {
    content = wrap("u", content);
  }
  if (format & IS_STRIKETHROUGH) {
    content = wrap("s", content);
  }
  if (node.style) {
    const safeStyle = sanitizeStyle(node.style);
    if (safeStyle) {
      content = `<span style="${safeStyle}">${content}</span>`;
    }
  }
  return content;
}

function renderLinkNode(node: SerializedLinkNode): string {
  const href = sanitizeUrl(node.url ?? "");
  const rel = node.rel ? ` rel="${escapeAttr(node.rel)}"` : "";
  const target = node.target ? ` target="${escapeAttr(node.target)}"` : "";
  const title = node.title ? ` title="${escapeAttr(node.title)}"` : "";
  return `<a href="${href}"${rel}${target}${title}>${renderChildren(node.children ?? [])}</a>`;
}

function renderCodeNode(node: SerializedCodeNode): string {
  const language = node.language ? ` data-lang="${escapeAttr(node.language)}"` : "";
  const content = renderChildren(node.children ?? []);
  return `<pre${language}><code${language}>${content}</code></pre>`;
}

function renderTableNode(node: SerializedTableNode): string {
  const rows = renderChildren(node.children ?? []);
  const striped = node.rowStriping ? " data-striped=\"true\"" : "";
  return `<table${striped}>${rows}</table>`;
}

function renderTableCell(node: SerializedTableCellNode): string {
  const tag = node.headerState && node.headerState > 0 ? "th" : "td";
  const colSpan = node.colSpan && node.colSpan > 1 ? ` colspan="${node.colSpan}"` : "";
  const rowSpan = node.rowSpan && node.rowSpan > 1 ? ` rowspan="${node.rowSpan}"` : "";
  const width = typeof node.width === "number" ? ` style="width:${Math.max(node.width, 1)}px"` : "";
  return `<${tag}${colSpan}${rowSpan}${width}>${renderChildren(node.children ?? [])}</${tag}>`;
}

function wrap(tag: string, inner: string): string {
  const safeInner = inner && inner.length > 0 ? inner : "<br />";
  return `<${tag}>${safeInner}</${tag}>`;
}

function resolveHeadingTag(node: SerializedHeadingNode): string {
  const tag = node.tag ?? "h1";
  if (/^h[1-6]$/iu.test(tag)) {
    return tag.toLowerCase();
  }
  return "h2";
}

function resolveListTag(node: SerializedListNode): string {
  return node.listType === "number" ? "ol" : "ul";
}

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url, "https://example.com");
    if (parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:") {
      return escapeAttr(url);
    }
  } catch {
    // ignore
  }
  return "#";
}

function sanitizeStyle(style: string): string {
  return escapeAttr(style.replace(/"/g, "\"").trim());
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
