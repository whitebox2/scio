import { $, component$, useStore } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

interface SignupResponse {
  ok: boolean;
  error?: string;
  code?: string;
}

export default component$(() => {
  const state = useStore({
    username: "",
    password: "",
    confirm: "",
    message: "",
    variant: "info" as "info" | "error" | "success",
    busy: false,
  });

  const submitSignup = $(async () => {
    if (state.busy) {
      return;
    }
    if (!state.username || !state.password) {
      state.message = "ユーザー名とパスワードを入力してください";
      state.variant = "error";
      return;
    }
    if (state.password !== state.confirm) {
      state.message = "パスワードが一致しません";
      state.variant = "error";
      return;
    }
    state.busy = true;
    state.message = "";
    try {
      const payload = { username: state.username.trim(), password: state.password };
      const res = await fetch("/auth/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as SignupResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "サインアップに失敗しました");
      }
      state.message = "サインアップに成功しました。ログインしてください。";
      state.variant = "success";
      state.password = "";
      state.confirm = "";
    } catch (error) {
      state.message = error instanceof Error ? error.message : "サインアップに失敗しました";
      state.variant = "error";
    } finally {
      state.busy = false;
    }
  });

  return (
    <section class="auth-page">
      <h1>サインアップ</h1>
      <p>パスワードは12文字以上で英大小・数字・記号を含める必要があります。</p>
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
          autoComplete="new-password"
          onInput$={(_, element) => {
            state.password = element.value;
          }}
        />
      </label>
      <label>
        パスワード（確認）
        <input
          type="password"
          value={state.confirm}
          autoComplete="new-password"
          onInput$={(_, element) => {
            state.confirm = element.value;
          }}
        />
      </label>
      <button type="button" disabled={state.busy} onClick$={submitSignup}>
        {state.busy ? "作成中..." : "アカウント作成"}
      </button>
      <p>
        既にアカウントをお持ちの場合は <a href="/auth/login">ログイン</a> してください。
      </p>
    </section>
  );
});

export const head: DocumentHead = {
  title: "サインアップ | Scio",
};
