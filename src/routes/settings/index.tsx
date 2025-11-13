import { $, component$, useStore } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import type { SshKeyRecord } from "~/server/auth";
import { withAuthService } from "~/server/auth";
import { requireAuth } from "~/server/guards";

interface KeysResponse {
  ok: boolean;
  keys: SshKeyRecord[];
  error?: string;
}

export const useSshKeys = routeLoader$(async (ev) => {
  try {
    const session = await requireAuth(ev);
    const keys = await withAuthService((service) => service.listSshKeys(session.userId));
    return { keys };
  } catch {
    return { keys: [] };
  }
});

export default component$(() => {
  const loader = useSshKeys();
  const state = useStore({
    keys: loader.value.keys as SshKeyRecord[],
    publicKey: "",
    label: "",
    message: "",
    messageVariant: "info" as "info" | "error" | "success",
    busy: false,
  });

  const refreshKeys = $(async () => {
    const data = await requestKeys();
    state.keys = data.keys ?? [];
  });

  const submitKey = $(async () => {
    if (state.busy) {
      return;
    }
    state.busy = true;
    state.message = "";
    try {
      await mutateKeys("POST", { publicKey: state.publicKey, label: state.label });
      state.publicKey = "";
      state.label = "";
      state.message = "SSHキーを追加しました";
      state.messageVariant = "success";
      await refreshKeys();
    } catch (error) {
      state.message = error instanceof Error ? error.message : "SSHキーの追加に失敗しました";
      state.messageVariant = "error";
    } finally {
      state.busy = false;
    }
  });

  const toggleKey = $(async (key: SshKeyRecord) => {
    if (state.busy) {
      return;
    }
    state.busy = true;
    state.message = "";
    try {
      await mutateKeys("PATCH", { publicKey: key.public_key, enabled: !key.enabled });
      state.message = key.enabled ? "キーを無効化しました" : "キーを有効化しました";
      state.messageVariant = "success";
      await refreshKeys();
    } catch (error) {
      state.message = error instanceof Error ? error.message : "更新に失敗しました";
      state.messageVariant = "error";
    } finally {
      state.busy = false;
    }
  });

  const deleteKey = $(async (key: SshKeyRecord) => {
    if (state.busy) {
      return;
    }
    state.busy = true;
    state.message = "";
    try {
      await mutateKeys("DELETE", { publicKey: key.public_key });
      state.message = "SSHキーを削除しました";
      state.messageVariant = "success";
      await refreshKeys();
    } catch (error) {
      state.message = error instanceof Error ? error.message : "削除に失敗しました";
      state.messageVariant = "error";
    } finally {
      state.busy = false;
    }
  });

  return (
    <section class="settings">
      <h1>SSHキー設定</h1>
      <p>登録済みの公開鍵のみを保存します。秘密鍵は絶対にアップロードしないでください。</p>
      {state.message && (
        <div class={`alert alert-${state.messageVariant}`}>
          {state.message}
        </div>
      )}
      <div class="ssh-form">
        <label>
          公開鍵
          <textarea
            value={state.publicKey}
            onInput$={(_, element) => {
              state.publicKey = element.value;
            }}
            placeholder="ssh-ed25519 AAAAC3... user@host"
            rows={4}
          />
        </label>
        <label>
          ラベル (任意)
          <input
            type="text"
            value={state.label}
            onInput$={(_, element) => {
              state.label = element.value;
            }}
            placeholder="laptop"
          />
        </label>
        <button type="button" disabled={state.busy} onClick$={submitKey}>
          SSHキーを追加
        </button>
      </div>
      <div class="ssh-list">
        {state.keys.length === 0 ? (
          <p>登録済みのSSHキーはありません。</p>
        ) : (
          <ul>
            {state.keys.map((key) => (
              <li key={key.public_key} class="ssh-item">
                <div>
                  <strong>{key.label ?? "(ラベルなし)"}</strong>
                  <div class="ssh-fingerprint">{renderFingerprint(key.public_key)}</div>
                  <div class="ssh-meta">{key.enabled ? "有効" : "無効"}</div>
                </div>
                <div class="ssh-actions">
                  <button type="button" disabled={state.busy} onClick$={() => toggleKey(key)}>
                    {key.enabled ? "無効化" : "有効化"}
                  </button>
                  <button type="button" disabled={state.busy} onClick$={() => deleteKey(key)}>
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
});

const requestKeys = async (): Promise<KeysResponse> => {
  const res = await fetch("/auth/api/ssh-keys", {
    credentials: "include",
  });
  const data = (await res.json()) as KeysResponse;
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? "SSHキーの取得に失敗しました");
  }
  return data;
};

const mutateKeys = async (method: "POST" | "PATCH" | "DELETE", body: unknown): Promise<KeysResponse> => {
  const res = await fetch("/auth/api/ssh-keys", {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as KeysResponse;
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? "SSHキー操作に失敗しました");
  }
  return data;
};

const renderFingerprint = (key: string): string => {
  const parts = key.split(" ");
  if (parts.length < 2) {
    return key;
  }
  const type = parts[0];
  const fingerprint = parts[1].slice(-24);
  return `${type} …${fingerprint}`;
};
