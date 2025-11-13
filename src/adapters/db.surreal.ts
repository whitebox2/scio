import { Surreal } from "surrealdb";

export type SurrealClient = Surreal;

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export async function connect(): Promise<SurrealClient> {
  const db = new Surreal();
  const namespace = requiredEnv("SCIO_DB_NS");
  const database = requiredEnv("SCIO_DB_DB");
  await db.connect(requiredEnv("SCIO_DB_URL"), {
    namespace,
    database,
    authentication: {
      username: requiredEnv("SCIO_DB_USER"),
      password: requiredEnv("SCIO_DB_PASS"),
    },
  });
  return db;
}

export async function exec<T = unknown>(
  db: SurrealClient,
  sql: string,
  vars?: Record<string, unknown>,
): Promise<T> {
  const result = db.query(sql, vars ?? {});
  if (typeof result?.collect === "function") {
    return (await result.collect()) as T;
  }
  return (await result) as T;
}
