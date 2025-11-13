import { fileURLToPath } from "node:url";
import path from "node:path";
import { Surreal } from "surrealdb";

const ADMIN_HASH_PLACEHOLDER = "REDACTED_PLACEHOLDER";

const env = (key, fallback) => {
  const value = process.env[key];
  if (!value && typeof fallback === "undefined") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? fallback;
};

const parseInitialAdmin = () => {
  const raw = env("SCIO_INITIAL_ADMIN", "admin:change-me");
  const [username] = raw.split(":");
  return username || "admin";
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

async function runQuery(db, sql, vars) {
  const response = db.query(sql, vars ?? {});
  if (typeof response?.collect === "function") {
    return await response.collect();
  }
  return await response;
}

function firstRecord(resultSets) {
  if (!Array.isArray(resultSets) || resultSets.length === 0) {
    return undefined;
  }
  const entry = resultSets[0];
  if (Array.isArray(entry)) {
    return entry[0];
  }
  if (entry && typeof entry === "object" && "result" in entry) {
    const rows = entry.result;
    return Array.isArray(rows) ? rows[0] : rows;
  }
  return entry;
}

export async function runSeed(options = {}) {
  const db = options.db ?? (await createClient());
  const shouldClose = !options.db && typeof db.close === "function";
  try {
    const username = parseInitialAdmin();
    await runQuery(
      db,
      `
      LET $u = (SELECT * FROM users WHERE username = $username);
      IF count($u) == 0 THEN CREATE users SET username = $username, password_hash = $ph, role = 'admin'; END;
    `,
      { username, ph: ADMIN_HASH_PLACEHOLDER },
    );
    const ownerResult = await runQuery(
      db,
      "SELECT * FROM users WHERE username = $username LIMIT 1",
      { username },
    );
    const owner = firstRecord(ownerResult);
    if (!owner) {
      console.warn("Admin user not found after seed; aborting project bootstrap");
      return [];
    }
    const ownerId = owner.id;
    const seeds = [
      { name: "Personal", visibility: "private" },
      { name: "All-team", visibility: "team" },
    ];
    const created = [];
    for (const seed of seeds) {
      await runQuery(
        db,
        `
        LET $existing = (SELECT * FROM projects WHERE name = $name AND owner_id = $owner);
        IF count($existing) == 0 THEN CREATE projects SET name = $name, visibility = $visibility, owner_id = $owner; END;
      `,
        { name: seed.name, visibility: seed.visibility, owner: ownerId },
      );
      created.push(seed.name);
    }
    return created;
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
  runSeed()
    .then(() => {
      console.info("Seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
