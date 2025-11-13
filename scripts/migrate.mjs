import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Surreal } from "surrealdb";

const DEFAULT_MIGRATIONS_DIR = path.resolve(process.cwd(), "migrations");

const env = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

async function createClient() {
  const db = new Surreal();
  const namespace = env("SCIO_DB_NS");
  const database = env("SCIO_DB_DB");
  await db.connect(env("SCIO_DB_URL"), {
    namespace,
    database,
    authentication: {
      username: env("SCIO_DB_USER"),
      password: env("SCIO_DB_PASS"),
    },
  });
  return db;
}

async function ensureLedger(db) {
  await runQuery(
    db,
    `
    DEFINE TABLE IF NOT EXISTS _migrations SCHEMAFULL;
    DEFINE FIELD IF NOT EXISTS id ON TABLE _migrations TYPE string;
    DEFINE FIELD IF NOT EXISTS applied_at ON TABLE _migrations TYPE datetime;
    DEFINE INDEX IF NOT EXISTS _migrations_id_unique ON TABLE _migrations COLUMNS id UNIQUE;
  `,
  );
}

function hasRows(entry) {
  if (Array.isArray(entry)) {
    return entry.length > 0;
  }
  if (entry && typeof entry === "object" && "result" in entry) {
    const rows = entry.result;
    return Array.isArray(rows) ? rows.length > 0 : Boolean(rows);
  }
  return Boolean(entry);
}

async function runQuery(db, sql, vars) {
  const response = db.query(sql, vars ?? {});
  if (typeof response?.collect === "function") {
    return await response.collect();
  }
  return await response;
}

export async function runMigrations(options = {}) {
  const migrationsDir = options.migrationsDir ?? DEFAULT_MIGRATIONS_DIR;
  await fs.mkdir(migrationsDir, { recursive: true });
  const db = options.db ?? (await createClient());
  const shouldClose = !options.db && typeof db.close === "function";
  try {
    await ensureLedger(db);
    const files = (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith(".surql"))
      .sort();
    const applied = [];
    for (const file of files) {
      const id = file;
      const check = await runQuery(db, "SELECT * FROM _migrations WHERE id = $id", {
        id,
      });
      if (hasRows(check?.[0])) {
        continue;
      }
      const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
      await runQuery(db, sql);
      await runQuery(db, "CREATE _migrations SET id = $id, applied_at = time::now()", {
        id,
      });
      applied.push(id);
      console.info(`Applied migration ${id}`);
    }
    return applied;
  } finally {
    if (shouldClose) {
      await db.close();
    }
  }
}

const isCLI = Boolean(
  process.argv[1] &&
    fileURLToPath(import.meta.url) === path.resolve(process.argv[1]),
);

if (isCLI) {
  runMigrations()
    .then((applied) => {
      if (applied.length === 0) {
        console.info("No migrations to apply");
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
