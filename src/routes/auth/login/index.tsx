import { $, component$, useStore } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

interface AuthResponse {
  ok: boolean;
  error?: string;
  code?: string;
}

export default component$(() => {
  const state = useStore({
    username: "",
    password: "",
    message: "",
    variant: "info" as "info" | "error" | "success",
    busy: false,
  });

  const submitLogin = $(async () => {
    if (state.busy) {
      return;
    }
    if (!state.username || !state.password) {
      state.message = "ユーザー名とパスワードを入力してください";
      state.variant = "error";
      return;
    }
    state.busy = true;
    state.message = "";
    try {
      const payload = { username: state.username.trim(), password: state.password };
      const res = await fetch("/auth/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as AuthResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "ログインに失敗しました");
      }
      state.message = "ログインしました。リダイレクト中...";
      state.variant = "success";
      state.password = "";
      globalThis.window?.location.assign("/settings");
    } catch (error) {
      state.message = error instanceof Error ? error.message : "ログインに失敗しました";
      state.variant = "error";
    } finally {
      state.busy = false;
    }
  });

  return (
    <section class="auth-page">
      <h1>ログイン</h1>
      <p>登録済みの認証情報でサインインします。トークンは HTTP-only クッキーで保持されます。</p>
      {state.message && (
        <div class={`alert alert-${state.variant}`}>
          {state.message}
        </div>
      )}
      <label>
        ユーザー名
        <input
          type="text"
          value={state.username}
          autoComplete="username"
          onInput$={(_, element) => {
            state.username = element.value;
          }}
        />
      </label>
      <label>
        パスワード
        <input
          type="password"
          value={state.password}
          autoComplete="current-password"
          onInput$={(_, element) => {
            state.password = element.value;
          }}
        />
      </label>
      <button type="button" disabled={state.busy} onClick$={submitLogin}>
        {state.busy ? "送信中..." : "ログイン"}
      </button>
      <p>
        初めて利用する場合は <a href="/auth/signup">サインアップ</a> してください。
      </p>
    </section>
  );
});

export const head: DocumentHead = {
  title: "ログイン | Scio",
};
