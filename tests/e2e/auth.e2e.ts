import { expect, test } from "@playwright/test";

const uniqueCreds = () => {
  const suffix = Date.now().toString(36);
  return {
    username: `member-${suffix}`,
    password: `Sup3r!Pass-${suffix}-Aa1`,
  };
};

test.describe("認証エンドツーエンド", () => {
  test("サインアップ→ログイン→設定画面", async ({ page, context }) => {
    const creds = uniqueCreds();
    page.on("console", (msg) => {
      console.log("[browser console]", msg.type(), msg.text());
    });

    await page.goto("/auth/signup");
    await page.getByLabel(/ユーザー名/).fill(creds.username);
    await page.getByLabel(/^パスワード$/).fill(creds.password);
    await page.getByLabel(/パスワード（確認）/).fill(creds.password);
    const signupResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/auth/api/signup") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "アカウント作成" }).click();
    const signupResponse = await signupResponsePromise;
    expect([200, 201]).toContain(signupResponse.status());

    await page.getByRole("link", { name: "ログイン" }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
    await page.getByLabel(/ユーザー名/).fill(creds.username);
    await page.getByLabel(/^パスワード$/).fill(creds.password);

    const loginResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/auth/api/login") && response.status() === 200,
    );
    await page.getByRole("button", { name: "ログイン" }).click();
    await loginResponsePromise;

    await page.waitForURL(/\/settings/);
    await expect(page.getByRole("heading", { name: "SSHキー設定" })).toBeVisible();

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((cookie) => cookie.name === "scio.sid");
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.sameSite).toBe("Strict");
  });
});
