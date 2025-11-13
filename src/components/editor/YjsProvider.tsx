import { Slot, component$, createContextId, useContextProvider, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { useContext } from "@builder.io/qwik";
import type { SerializedEditorState } from "lexical";
import { Awareness } from "y-protocols/awareness";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { decodeBase64, encodeBase64 } from "~/utils/base64";
import { writeSnapshotToDoc } from "~/utils/lexical-serialization";
import { emitClientMetric } from "~/utils/telemetry";

interface PeerState {
  name: string;
  color: string;
}

export interface CollabStatus {
  online: boolean;
  phase: "idle" | "pushing" | "pulling" | "offline" | "error";
  lastSyncTs?: number;
  error?: string;
  peers: PeerState[];
}

export interface CollabContextValue {
  doc: Y.Doc | null;
  awareness: Awareness | null;
  persistSnapshot(state: SerializedEditorState): void;
  status: CollabStatus;
}

export interface YjsProviderProps {
  docId: string;
  initialUpdateB64?: string | null;
  snapshot?: SerializedEditorState;
  pullUrl: string;
  pushUrl: string;
  userName?: string;
  pullIntervalMs?: number;
}

export const CollabContext = createContextId<CollabContextValue>("editor.collab");

export const useCollabState = (): CollabContextValue => useContext(CollabContext);

export default component$<YjsProviderProps>((props) => {
  const status = useStore<CollabStatus>({
    online: typeof navigator === "undefined" ? true : navigator.onLine,
    phase: "idle",
    peers: [],
  });
  const context = useStore<CollabContextValue>({
    doc: null,
    awareness: null,
    persistSnapshot: () => {},
    status,
  });
  useContextProvider(CollabContext, context);

  useVisibleTask$(({ cleanup }) => {
    if (context.doc) {
      return;
    }
    const doc = new Y.Doc();
    context.doc = doc;
    if (props.initialUpdateB64) {
      try {
        Y.applyUpdate(doc, decodeBase64(props.initialUpdateB64), "scio:init");
      } catch (error) {
        status.phase = "error";
        status.error = error instanceof Error ? error.message : "Failed to restore CRDT";
      }
    } else if (props.snapshot) {
      writeSnapshotToDoc(doc, props.snapshot);
    }

    const awareness = new Awareness(doc);
    awareness.setLocalState({
      name: props.userName ?? "You",
      color: pickColor(props.docId),
      focusing: true,
      anchorPos: null,
      focusPos: null,
      awarenessData: {},
    });
    context.awareness = awareness;

    context.persistSnapshot = (state: SerializedEditorState) => {
      if (context.doc) {
        writeSnapshotToDoc(context.doc, state);
      }
    };

    const pending: Uint8Array[] = [];
    let pushTimeout: ReturnType<typeof setTimeout> | null = null;
    let pushing = false;
    let pulling = false;

    const persistence = new IndexeddbPersistence(`scio-doc-${props.docId}`, doc);
    persistence.on("synced", () => {
      status.phase = status.phase === "offline" ? "offline" : "idle";
    });

    const updateHandler = (update: Uint8Array, origin: unknown) => {
      if (origin === "scio:remote") {
        return;
      }
      pending.push(update);
      schedulePush();
    };
    doc.on("update", updateHandler);

    const awarenessHandler = () => {
      status.peers = extractPeers(awareness);
    };
    awareness.on("update", awarenessHandler);
    status.peers = extractPeers(awareness);

    const handleOnline = () => {
      status.online = true;
      if (status.phase === "offline") {
        status.phase = "idle";
      }
      schedulePush(true);
      void pullUpdates();
    };
    const handleOffline = () => {
      status.online = false;
      status.phase = "offline";
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const pullInterval = window.setInterval(() => {
      void pullUpdates();
    }, props.pullIntervalMs ?? 8000);

    cleanup(() => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(pullInterval);
      awareness.off("update", awarenessHandler);
      doc.off("update", updateHandler);
      context.doc = null;
      context.awareness = null;
      void persistence.destroy();
      doc.destroy();
    });

    function schedulePush(force?: boolean) {
      if (!status.online) {
        return;
      }
      if (force) {
        void pushUpdates();
        return;
      }
      if (pushTimeout) {
        return;
      }
      pushTimeout = window.setTimeout(() => {
        pushTimeout = null;
        void pushUpdates();
      }, 400);
    }

    async function pushUpdates() {
      if (pushing || pending.length === 0 || !status.online) {
        return;
      }
      const batch = pending.splice(0);
      const merged = Y.mergeUpdates(batch);
      pushing = true;
      status.phase = "pushing";
      try {
        const response = await fetch(props.pushUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ updateB64: encodeBase64(merged) }),
        });
        if (!response.ok) {
          throw new Error(`Push failed (${response.status})`);
        }
        status.phase = "idle";
        status.error = undefined;
        status.lastSyncTs = Date.now();
        emitClientMetric({ event: "crdt_push", bytes: merged.byteLength, docId: props.docId });
        await pullUpdates();
      } catch (error) {
        status.phase = "error";
        status.error = error instanceof Error ? error.message : "Push failed";
        pending.unshift(merged);
      } finally {
        pushing = false;
      }
    }

    async function pullUpdates() {
      if (pulling || !status.online || !context.doc) {
        return;
      }
      pulling = true;
      if (status.phase === "idle") {
        status.phase = "pulling";
      }
      try {
        const stateVector = encodeBase64(Y.encodeStateVector(context.doc));
        const response = await fetch(props.pullUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ stateVectorB64: stateVector }),
        });
        if (!response.ok) {
          throw new Error(`Pull failed (${response.status})`);
        }
        const payload = (await response.json()) as { updateB64?: string | null; ts?: string };
        if (payload.updateB64) {
          Y.applyUpdate(context.doc, decodeBase64(payload.updateB64), "scio:remote");
        }
        status.phase = pending.length > 0 ? "pushing" : "idle";
        status.error = undefined;
        status.lastSyncTs = Date.now();
      } catch (error) {
        status.phase = "error";
        status.error = error instanceof Error ? error.message : "Pull failed";
      } finally {
        pulling = false;
      }
    }
  });

  return <Slot />;
});

function pickColor(seed: string): string {
  const palette = ["#2563eb", "#db2777", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % palette.length;
  }
  return palette[hash] ?? palette[0];
}

function extractPeers(awareness: Awareness): PeerState[] {
  const peers: PeerState[] = [];
  awareness.getStates().forEach((state) => {
    if (!state) {
      return;
    }
    const name = typeof state.name === "string" ? state.name : "Editor";
    const color = typeof state.color === "string" ? state.color : pickColor(name);
    peers.push({ name, color });
  });
  return peers;
}
