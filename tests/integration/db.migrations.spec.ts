import path from "node:path";
import { describe, expect, it } from "vitest";
import { runMigrations } from "../../scripts/migrate.mjs";

const migrationsDir = path.resolve(process.cwd(), "migrations");

const makeResult = (rows: unknown[]) => [{ result: rows }];

class FakeSurreal {
  readonly ledger = new Set<string>();
  readonly tables = new Set<string>();
  readonly indexes = new Set<string>();
  readonly analyzers = new Set<string>();

  captureSchema(sql: string) {
    for (const [, table] of sql.matchAll(
      /DEFINE TABLE(?: IF NOT EXISTS)? ([A-Za-z0-9_]+)/g,
    )) {
      this.tables.add(table);
    }
    for (const [, analyzer] of sql.matchAll(
      /DEFINE ANALYZER(?: IF NOT EXISTS)? ([A-Za-z0-9_]+)/g,
    )) {
      this.analyzers.add(analyzer);
    }
    for (const [, index] of sql.matchAll(
      /DEFINE INDEX(?: IF NOT EXISTS)? ([A-Za-z0-9_]+)/g,
    )) {
      this.indexes.add(index);
    }
  }

  async query(sql: string, vars?: Record<string, unknown>) {
    if (sql.includes("SELECT * FROM _migrations WHERE id = $id")) {
      const id = vars?.id as string;
      return makeResult(this.ledger.has(id) ? [{ id }] : []);
    }
    if (sql.startsWith("CREATE _migrations SET")) {
      this.ledger.add(vars?.id as string);
      return makeResult([{ id: vars?.id }]);
    }
    this.captureSchema(sql);
    return makeResult([]);
  }
}

describe("migrations runner", () => {
  it("applies migrations once, records schema assets, and skips re-runs", async () => {
    const fakeDb = new FakeSurreal();

    const firstRun = await runMigrations({ db: fakeDb, migrationsDir });
    expect(firstRun).toEqual([
      "0001_init.surql",
      "0002_fts.surql",
      "0003_constraints.surql",
      "0004_crdt.surql",
      "0004_search_blob_patch.surql",
      "0005_summary_policy_patch.surql",
    ]);

    const tables = Array.from(fakeDb.tables);
    for (const table of [
      "users",
      "projects",
      "folders",
      "files",
      "documents",
      "document_revisions",
      "shares",
    ]) {
      expect(tables).toContain(table);
    }
    expect(Array.from(fakeDb.indexes)).toEqual(
      expect.arrayContaining([
        "idx_users_username_unique",
        "idx_projects_owner_visibility",
        "idx_folders_project_path",
        "idx_files_folder_name",
        "idx_revisions_doc_time",
        "idx_shares_url_id_unique",
        "idx_documents_search",
      ]),
    );
    expect(Array.from(fakeDb.analyzers)).toContain("scio_en_ja");

    const secondRun = await runMigrations({ db: fakeDb, migrationsDir });
    expect(secondRun).toHaveLength(0);
  });
});
