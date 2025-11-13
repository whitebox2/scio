import { $, component$, useSignal, useStore, useVisibleTask$ } from "@builder.io/qwik";
import type { PropFunction } from "@builder.io/qwik";
import type { SerializedEditorState } from "lexical";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_NORMAL,
  KEY_DOWN_COMMAND,
  createEditor,
  type EditorState,
  type LexicalEditor,
} from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeNode, $createCodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { TableCellNode, TableNode, TableRowNode, $createTableCellNode, $createTableNode, $createTableRowNode } from "@lexical/table";
import {
  createBindingV2__EXPERIMENTAL,
  initLocalState,
  setLocalStateFocus,
  syncLexicalUpdateToYjsV2__EXPERIMENTAL,
  syncYjsChangesToLexicalV2__EXPERIMENTAL,
  syncYjsStateToLexicalV2__EXPERIMENTAL,
  type BindingV2,
  type Provider,
  type ProviderAwareness,
} from "@lexical/yjs";
import type { Awareness } from "y-protocols/awareness";
import type { Transaction, XmlElement, XmlText, YEvent } from "yjs";
import type { CollabStatus } from "./YjsProvider";
import { useCollabState } from "./YjsProvider";

interface LexicalEditorProps {
  docId: string;
  initialState: SerializedEditorState;
  onStateChange$?: PropFunction<(state: SerializedEditorState) => void>;
  onSave$?: PropFunction<(state: SerializedEditorState) => void>;
}

interface SlashAction {
  label: string;
  action: (editor: LexicalEditor | null) => void;
}

export default component$<LexicalEditorProps>((props) => {
  const collab = useCollabState();
  const editorRef = useSignal<LexicalEditor | null>(null);
  const rootRef = useSignal<HTMLDivElement>();
  const latestState = useStore<{ value: SerializedEditorState }>({ value: props.initialState });
  const menuState = useStore({ open: false, activeIndex: 0 });
  const actions: SlashAction[] = [
    { label: "Insert table (2×2)", action: insertDefaultTable },
    { label: "Insert code block", action: insertCodeBlock },
  ];

  useVisibleTask$(({ cleanup }) => {
    if (!rootRef.value || !collab.doc) {
      return;
    }

    const editor = createEditor({
      namespace: `doc-${props.docId}`,
      theme: editorTheme,
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, TableNode, TableRowNode, TableCellNode, LinkNode],
      editable: true,
    });
    editor.setRootElement(rootRef.value);
    editor.setEditorState(editor.parseEditorState(JSON.stringify(props.initialState)));
    editorRef.value = editor;

    const provider = createAwarenessProvider(collab.awareness);
    initLocalState(provider, collab.awareness?.getLocalState()?.name ?? (props.docId ?? "You"), pickColor(props.docId), true, {});

    const binding = createBindingV2__EXPERIMENTAL(editor, props.docId, collab.doc, new Map([[props.docId, collab.doc]]));
    syncYjsStateToLexicalV2__EXPERIMENTAL(binding, provider);

    const observer = (events: Array<YEvent<XmlElement | XmlText>>, transaction: Transaction) => {
      syncYjsChangesToLexicalV2__EXPERIMENTAL(binding, provider, events, transaction, false);
    };
    binding.root.observeDeep(observer);

    const unregister = editor.registerUpdateListener(({ editorState, prevEditorState, dirtyElements, normalizedNodes, tags }) => {
      syncLexicalUpdateToYjsV2__EXPERIMENTAL(binding, provider, prevEditorState, editorState, dirtyElements, normalizedNodes, tags);
      updateLatestState(editorState, latestState, props.onStateChange$, collab.persistSnapshot);
    });

    const keydownUnregister = editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => handleKeydown(event, editor, menuState, actions, props.onSave$, latestState),
      COMMAND_PRIORITY_NORMAL,
    );

    const focusin = () => {
      setLocalStateFocus(provider, collab.awareness?.getLocalState()?.name ?? "You", collab.awareness?.getLocalState()?.color ?? "#2563eb", true, {});
    };
    const focusout = () => {
      menuState.open = false;
      setLocalStateFocus(provider, collab.awareness?.getLocalState()?.name ?? "You", collab.awareness?.getLocalState()?.color ?? "#2563eb", false, {});
    };
    rootRef.value?.addEventListener("focusin", focusin);
    rootRef.value?.addEventListener("focusout", focusout);

    cleanup(() => {
      binding.root.unobserveDeep(observer);
      unregister();
      keydownUnregister();
      rootRef.value?.removeEventListener("focusin", focusin);
      rootRef.value?.removeEventListener("focusout", focusout);
      editor.setRootElement(null);
      editorRef.value = null;
    });
  });

  const handleSave$ = $(async () => {
    if (props.onSave$) {
      await props.onSave$(latestState.value);
    }
  });

  const collabStatus = collab.status;

  return (
    <section class="flex flex-col gap-4">
      <header class="flex flex-wrap items-center justify-between gap-3" role="region" aria-label="Collaboration status">
        <div class="flex items-center gap-3" role="status" aria-live="polite">
          <div class={`h-2.5 w-2.5 rounded-full ${statusColor(collabStatus.phase, collabStatus.online)}`} aria-hidden="true" />
          <span class="text-sm text-slate-500">
            {collabStatus.online ? collabStatus.phase : "offline"}
            {collabStatus.lastSyncTs ? ` • synced ${timeAgo(collabStatus.lastSyncTs)}` : ""}
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          {collabStatus.peers.map((peer) => (
            <span
              key={`${peer.name}-${peer.color}`}
              class="rounded-full px-2 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: peer.color }}
              aria-label={`Editing: ${peer.name}`}
            >
              {peer.name}
            </span>
          ))}
        </div>
      </header>
      {collabStatus.error && (
        <p class="text-sm text-rose-600" role="alert">
          {collabStatus.error}
        </p>
      )}
      <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center gap-2 border-b border-slate-100 px-4 py-2" role="toolbar" aria-label="Editor toolbar">
          <button
            type="button"
            class="rounded px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
            onClick$={() => handleSave$()}
          >
            Save (⌘/Ctrl+S)
          </button>
          <div class="text-xs text-slate-400">Press "/" for insert menu</div>
        </div>
        <div class="relative">
          <div
            ref={rootRef}
            class="min-h-[320px] w-full px-6 py-5 text-base leading-6 focus:outline-none"
            contentEditable
            role="textbox"
            aria-multiline="true"
            aria-label="Document editor"
            spellcheck
          />
          {menuState.open && (
            <div
              class="absolute left-6 top-6 w-56 rounded-md border border-slate-200 bg-white shadow-lg"
              role="menu"
              aria-label="Insert menu"
            >
              {actions.map((action, index) => (
                <button
                  key={action.label}
                  type="button"
                  role="menuitem"
                  class={`flex w-full items-center justify-between px-3 py-2 text-sm ${menuState.activeIndex === index ? "bg-slate-100 text-slate-900" : "text-slate-600"}`}
                  onClick$={() => {
                    menuState.open = false;
                    action.action(editorRef.value);
                  }}
                >
                  {action.label}
                  <kbd class="rounded bg-slate-200 px-1 text-[10px] font-semibold text-slate-600">Enter</kbd>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

function updateLatestState(
  editorState: EditorState,
  latestState: { value: SerializedEditorState },
  onChange: PropFunction<(state: SerializedEditorState) => void> | undefined,
  persistSnapshot: (state: SerializedEditorState) => void,
): void {
  editorState.read(() => {
    const json = editorState.toJSON();
    latestState.value = json;
    persistSnapshot(json);
    if (onChange) {
      void onChange(json);
    }
  });
}

function handleKeydown(
  event: KeyboardEvent,
  editor: LexicalEditor,
  menuState: { open: boolean; activeIndex: number },
  actions: SlashAction[],
  onSave: PropFunction<(state: SerializedEditorState) => void> | undefined,
  latestState: { value: SerializedEditorState },
): boolean {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    if (onSave) {
      void onSave(latestState.value);
    }
    return true;
  }
  if (event.key === "/" && !event.metaKey && !event.ctrlKey) {
    menuState.open = true;
    menuState.activeIndex = 0;
    return false;
  }
  if (!menuState.open) {
    return false;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    menuState.activeIndex = (menuState.activeIndex + 1) % actions.length;
    return true;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    menuState.activeIndex = (menuState.activeIndex - 1 + actions.length) % actions.length;
    return true;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    menuState.open = false;
    actions[menuState.activeIndex]?.action(editor);
    return true;
  }
  if (event.key === "Escape") {
    menuState.open = false;
    return true;
  }
  return false;
}

function insertDefaultTable(editor: LexicalEditor | null): void {
  if (!editor) {
    return;
  }
  editor.update(() => {
    const table = $createTableNode();
    for (let row = 0; row < 2; row += 1) {
      const rowNode = $createTableRowNode();
      for (let col = 0; col < 2; col += 1) {
        const cellNode = $createTableCellNode();
        cellNode.append($createParagraphNode());
        rowNode.append(cellNode);
      }
      table.append(rowNode);
    }
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      selection.insertNodes([table]);
    } else {
      $getRoot().append(table);
    }
  });
}

function insertCodeBlock(editor: LexicalEditor | null): void {
  if (!editor) {
    return;
  }
  editor.update(() => {
    const codeNode = $createCodeNode();
    codeNode.append($createParagraphNode());
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      selection.insertNodes([codeNode]);
    } else {
      $getRoot().append(codeNode);
    }
  });
}

const editorTheme = {
  paragraph: "mb-4 text-slate-800",
  quote: "border-l-4 border-slate-200 pl-4 italic text-slate-600",
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    code: "rounded bg-slate-100 px-1 font-mono text-sm",
  },
  heading: {
    h1: "text-3xl font-semibold text-slate-900 mt-4 mb-3",
    h2: "text-2xl font-semibold text-slate-900 mt-4 mb-3",
    h3: "text-xl font-semibold text-slate-900 mt-4 mb-2",
  },
  code: "block bg-slate-900 text-slate-50 p-4 rounded font-mono text-sm overflow-x-auto",
};

function pickColor(seed: string): string {
  const palette = ["#2563eb", "#db2777", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % palette.length;
  }
  return palette[hash] ?? palette[0];
}

function statusColor(phase: CollabStatus["phase"], online: boolean): string {
  if (!online || phase === "offline") {
    return "bg-slate-300";
  }
  if (phase === "error") {
    return "bg-rose-500";
  }
  if (phase === "pushing" || phase === "pulling") {
    return "bg-amber-400";
  }
  return "bg-emerald-500";
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 5_000) {
    return "just now";
  }
  if (diff < 60_000) {
    const seconds = Math.floor(diff / 1000);
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(diff / 60_000);
  return `${minutes}m ago`;
}

function createAwarenessProvider(awareness: Awareness | null): Provider {
  const adapterCallbacks = new Map<() => void, (...args: unknown[]) => void>();
  const awarenessAdapter: ProviderAwareness = {
    getLocalState: () => awareness?.getLocalState() ?? null,
    getStates: () => awareness?.getStates() ?? new Map(),
    on: (type, cb) => {
      if (!awareness) {
        return;
      }
      const handler = () => cb();
      adapterCallbacks.set(cb, handler);
      awareness.on(type, handler);
    },
    off: (type, cb) => {
      const handler = adapterCallbacks.get(cb);
      if (handler && awareness) {
        awareness.off(type, handler);
        adapterCallbacks.delete(cb);
      }
    },
    setLocalState: (state) => awareness?.setLocalState(state ?? {}),
    setLocalStateField: (field, value) => awareness?.setLocalStateField(field, value),
  };
  return {
    awareness: awarenessAdapter,
    connect() {},
    disconnect() {},
    on: () => {},
    off: () => {},
  };
}
