# Page snapshot

```yaml
- generic [ref=e2]:
  - heading "ログイン" [level=1] [ref=e3]
  - paragraph [ref=e4]: 登録済みの認証情報でサインインします。トークンは HTTP-only クッキーで保持されます。
  - generic [ref=e5]: Unexpected token 'N', "Not a SSR "... is not valid JSON
  - generic [ref=e6]:
    - text: ユーザー名
    - textbox "ユーザー名" [ref=e7]: member-mhw0075l
  - generic [ref=e8]:
    - text: パスワード
    - textbox "パスワード" [ref=e9]: Sup3r!Pass-mhw0075l-Aa1
  - button "ログイン" [ref=e10]
  - paragraph [ref=e11]:
    - text: 初めて利用する場合は
    - link "サインアップ" [ref=e12] [cursor=pointer]:
      - /url: /auth/signup
    - text: してください。
```