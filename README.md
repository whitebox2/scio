# Scio Qwik City App

This directory contains the Scio Qwik City application that ships with SSR for the landing route and SPA-style navigation for subsequent transitions.

## Quick Start (inside the dev container)
1. Install deps once: `bun install`.
2. Copy the environment template for local experiments only: `cp .env.example .env` (never commit `.env`).
3. Start the dev server: `bun dev`. Override the bind values with `SCIO_DEV_HOST=0.0.0.0 SCIO_DEV_PORT=5174 bun dev` if port 5173 conflicts on your host.
4. Visit `http://localhost:5173/` (or your custom port) to confirm the SSR home route renders and SPA navigation works.

## Health Check
Use the production-style probe to confirm container readiness:
```bash
curl -s http://localhost:5173/api/health | jq .
```
The payload includes `status`, `version`, `commitSha`, `mode`, and `uptimeSec`. A non-200 response should be treated as unhealthy.

## Environment Variables
All non-secret configuration lives in `.env.example`. For local testing:
- `SCIO_MODE`, `SCIO_VERSION`, `SCIO_COMMIT_SHA`: identify the build.
- `SCIO_OBS_OTLP_ENDPOINT`: outbound OTLP collector.
- Feature toggles (`SCIO_FEATURE_*`) and bootstrap knobs (`SCIO_INITIAL_*`).
- Dev-server overrides (`SCIO_DEV_HOST`, `SCIO_DEV_PORT`, `SCIO_PREVIEW_PORT`).
- Data-layer placeholders (`SCIO_DB_URL`, `SCIO_DB_NS`, `SCIO_DB_DB`, `SCIO_DB_USER`, `SCIO_DB_PASS`, `SCIO_OBJECT_*`).
- Authentication knobs:
  - `SCIO_JWT_SECRET`: HMAC secret for `scio.sid`/`scio.refresh` cookies (required in all environments).
  - `SCIO_SESSION_TTL_SEC` / `SCIO_REFRESH_TTL_SEC`: cookie lifetimes in seconds.
  - `SCIO_AUTH_PBKDF2_ITER`, `SCIO_AUTH_SALT_LEN`, `SCIO_AUTH_DIGEST`: PBKDF2 parameters enforced server-side.
  - `SCIO_LOCKOUT_THRESHOLD`, `SCIO_LOCKOUT_WINDOW_SEC`: failed-login lockout window.

At runtime the container orchestrator injects the real values; keep secrets out of git and rotate via your deployment platform.

## Authentication & Cookie Behavior

- Username/password signup and login APIs live under `/auth/api/*` and rely on PBKDF2 hashing (configurable via the env variables above) per `.serena/memories/rule.md`.
- Successful logins mint short-lived JWTs stored in the `scio.sid` cookie (HTTP-only, `SameSite=strict`, `Secure`, `Path=/`). When refresh tokens are enabled, `scio.refresh` follows the same flags.
- Logout simply clears both cookies; no tokens are ever exposed to client JavaScript.
- Password policy: min 12 chars, must include upper/lower/digit/symbol, and reject whitespace. Weak attempts receive `weak_password` errors.
- Failed logins are recorded against both the username and the incoming IP (where provided). Reaching `SCIO_LOCKOUT_THRESHOLD` inside the configured window returns `429 locked_out` responses.
- SSH public keys can be added/toggled/removed via `/auth/api/ssh-keys` or the `/settings` GUI. Keys are validated for supported prefixes (`ssh-ed25519`, `ssh-rsa`, `ecdsa-sha2-nistp256`), base64 payload integrity, and length bounds before persisting to `users.ssh_keys`.

## Database Bootstrap
- Set the `SCIO_DB_*` variables to point at your SurrealDB namespace/database and credentials.
- Apply migrations (idempotent): `bun run migrate` or rely on the `prestart` hook (`bun run start`).
- Seed the admin account plus starter projects exactly once: `bun run seed`.
- Integration smoke: run `bun test` to execute the migration/search specs with mocked clients.

## End-to-End Tests

Playwright tests spin up the dev server over HTTPS with the in-memory auth driver so secure cookies can be validated locally.

1. 一度だけブラウザ依存を取得: `bunx playwright install --with-deps`
2. E2E を実行: `bun run test.e2e`

テストでは `SCIO_AUTH_DRIVER=memory` と `SCIO_JWT_SECRET` 等を自動セットし、`/auth/signup → /auth/login → /settings` のフローと `scio.sid` クッキー属性を検証します。
