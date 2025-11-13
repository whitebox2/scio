import { describe, expect, it } from "vitest";
import {
  composeSearchBlob,
  normalizeSearchQuery,
  type SearchRepo,
} from "../../src/models/repo";

interface IndexedDoc {
  id: string;
  project_id: string;
  title: string;
  body_rich: unknown;
  search_blob: string;
}

class InMemorySearchRepo implements SearchRepo {
  constructor(private readonly docs: IndexedDoc[]) {}

  async search(
    projectId: string,
    q: string,
    limit: number,
  ) {
    const normalizedQuery = normalizeSearchQuery(q);
    const matches = this.docs
      .filter((doc) => doc.project_id === projectId)
      .filter((doc) =>
        normalizeSearchQuery(doc.search_blob).includes(normalizedQuery),
      )
      .slice(0, limit)
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        snippet: doc.search_blob.slice(0, 120),
      }));
    return matches;
  }
}

describe("search integration", () => {
  const docs: IndexedDoc[] = [
    {
      id: "doc1",
      project_id: "project/p1",
      title: "Ａｌｐｈａ rollout",
      body_rich: { content: "Team バックログ" },
      search_blob: composeSearchBlob("Ａｌｐｈａ rollout", { content: "Team バックログ" }),
    },
    {
      id: "doc2",
      project_id: "project/p1",
      title: "Research",
      body_rich: { content: "Normalization plan" },
      search_blob: composeSearchBlob("Research", { content: "Normalization plan" }),
    },
  ];
  const repo = new InMemorySearchRepo(docs);

  it("matches queries after NFKC casefolding", async () => {
    const results = await repo.search("project/p1", "alpha", 5);
    expect(results[0]?.id).toBe("doc1");

    const nfkcResults = await repo.search("project/p1", "ａｌｐｈａ", 5);
    expect(nfkcResults[0]?.id).toBe("doc1");
  });

  it("handles mixed-width kana terms", async () => {
    const results = await repo.search("project/p1", "ﾊﾞｯｸﾛｸﾞ", 5);
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("doc1");
  });

  it("matches substring queries via app-side ngrams", async () => {
    const trigramResults = await repo.search("project/p1", "rol", 5);
    expect(trigramResults[0]?.id).toBe("doc1");

    const shortBodyResult = await repo.search("project/p1", "plan", 5);
    expect(shortBodyResult[0]?.id).toBe("doc2");
  });

  it("normalizes helper output", () => {
    expect(normalizeSearchQuery("Ｓｃｉｏ"))
      .toBe(normalizeSearchQuery("scio"));
  });
});
