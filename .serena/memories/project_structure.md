scio/
├─ .github/
│  └─ workflows/
│     └─ ci.yml                     # Lint, type-check, unit & E2E tests, container build
├─ .devcontainer/
│  └─ devcontainer.json             # arm64v8/node:trixie, Bun, PostgreSQL client/CLI, Vitest
├─ .vscode/
│  └─ settings.json
├─ biome.json                        # Lint rules (strict, no-any, project-specific)
├─ bun.lockb
├─ docker/
│  ├─ Dockerfile                    # App image (SSR + API)
│  ├─ Dockerfile.worker             # Background worker image
│  └─ compose.yml                   # Local stack (PostgreSQL, Object storage, OTEL)
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ README.md
├─ scripts/
│  ├─ prestart.mjs                  # Env checks, DB migrations trigger
│  ├─ migrate.mjs                   # DB/FTS bootstrap (PostgreSQL schema + FTS)
│  └─ seed.mjs                      # Optional dev seed (PostgreSQL)
├─ public/
│  └─ ...(static assets)
├─ src/
│  ├─ routes/                       # Qwik City routing (SSR pages + API endpoints)
│  │  ├─ index.tsx                  # Home (SSR)
│  │  ├─ projects/
│  │  │  ├─ index.tsx               # Project list (SSR)
│  │  │  └─ [projectId]/
│  │  │     ├─ index.tsx            # Folder/File view (SSR + SPA transitions)
│  │  │     ├─ breadcrumbs.tsx      # UI fragment
│  │  │     └─ api/
│  │  │        ├─ tree.ts           # GET project tree (endpoint)
│  │  │        └─ search.ts         # GET search (endpoint; query normalization + FTS)
│  │  ├─ documents/
│  │  │  ├─ [docId]/
│  │  │  │  ├─ index.tsx            # Document reading (SSR)
│  │  │  │  ├─ edit.tsx             # Editor (Lexical + Yjs; SPA)
│  │  │  │  └─ api/
│  │  │  │     ├─ index.ts          # GET/PATCH document (endpoint)
│  │  │  │     └─ revisions.ts      # GET revisions, POST auto-summary
│  │  ├─ files/
│  │  │  └─ api/
│  │  │     ├─ start.ts             # POST start chunked-upload (endpoint)
│  │  │     ├─ part.ts              # PUT chunk part (endpoint or signed URL proxy)
│  │  │     └─ complete.ts          # POST finalize (endpoint)
│  │  ├─ shares/
│  │  │  └─ api/
│  │  │     ├─ index.ts             # POST/DELETE share links
│  │  │     └─ [urlId]/index.ts     # GET shared resource metadata
│  │  ├─ auth/
│  │  │  └─ api/
│  │  │     ├─ signup.ts            # POST signup
│  │  │     ├─ login.ts             # POST login (HTTP-only cookie)
│  │  │     └─ ssh-keys.ts          # POST/PATCH SSH keys (GUI registration)
│  │  ├─ settings/
│  │  │  └─ index.tsx               # Personal/team settings (feature toggles)
│  │  └─ api/                        # Global API namespace (if preferred)
│  │     ├─ health.ts               # Liveness/readiness
│  │     └─ obs-test.ts             # Observability probe
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ LeftRail.tsx            # Project selector (Personal/Team seeded)
│  │  │  └─ Breadcrumbs.tsx
│  │  ├─ editor/
│  │  │  ├─ LexicalEditor.tsx       # Lexical + table plugin + code blocks + "/"
│  │  │  └─ YjsProvider.tsx         # CRDT session wiring
│  │  ├─ files/
│  │  │  ├─ UploadDropzone.tsx
│  │  │  └─ RangeDownloadLink.tsx
│  │  └─ history/
│  │     └─ RevisionList.tsx
│  ├─ server/                        # Server-only modules ($server()/endpoint logic)
│  │  ├─ auth.ts                     # signup/login, hashing (Argon2id/PBKDF2)
│  │  ├─ policy.ts                   # RBAC, tag rules, summary rules
│  │  ├─ search.ts                   # NFKC_Casefold (query-only), PostgreSQL FTS orchestration
│  │  ├─ uploads.ts                  # chunk session, part handling, finalize
│  │  ├─ shares.ts                   # URL issuance, revoke
│  │  ├─ revisions.ts                # diff meta, summary generation trigger
│  │  ├─ effect-runtime.ts           # Effect runtime (logging/validation/retry)
│  │  └─ obs.ts                      # logs/metrics/traces (OTLP)
│  ├─ adapters/                      # External integrations
│  │  ├─ db.postgres.ts              # PostgreSQL client, queries, migrations
│  │  ├─ object.storage.ts           # S3-compatible client (signed URL helpers)
│  │  ├─ mcp.client.ts               # MCP plugin client (document search)
│  │  └─ ssh.ts                      # SSH key registry adapter (optional)
│  ├─ models/                        # Types & repositories
│  │  ├─ domain.ts                   # User, Project, Folder, File, Document, Revision…
│  │  └─ repo.ts                     # Repo interfaces/impls (PostgreSQL-backed)
│  ├─ utils/
│  │  ├─ nfkc_casefold.ts            # Query normalization utilities
│  │  ├─ tags.ts                     # Leading-char checks, sort key extraction
│  │  ├─ http.ts                     # Response helpers, error mapping
│  │  └─ id.ts                       # url_id generator (base62/entropy)
│  ├─ styles/
│  │  └─ globals.css                 # Tailwind base
│  ├─ app.css                        # Qwik CSS entry
│  └─ root.tsx                       # Qwik root
├─ tests/
│  ├─ unit/
│  │  ├─ tags.spec.ts
│  │  ├─ nfkc_casefold.spec.ts
│  │  └─ id.spec.ts
│  ├─ integration/
│  │  ├─ api.search.spec.ts         # FTS normalization, ranking (PostgreSQL-backed)
│  │  ├─ api.uploads.spec.ts        # Chunked upload happy-path & retries
│  │  └─ api.documents.spec.ts      # CRUD + revisions + summary policy
│  └─ e2e/
│     ├─ create_edit_search_share.spec.ts
│     └─ upload_resume_rangeget.spec.ts
├─ .env.example                      # Minimal runtime config (no secrets)
└─ .dockerignore / .gitignore