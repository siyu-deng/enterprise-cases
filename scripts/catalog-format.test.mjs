import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { toSummaryCatalog } from "./catalog-format.mjs";

test("source import persists summaries and collection dates without article bodies or marketing fields", () => {
  const collectedAt = "2026-11-03T05:50:01.753Z";
  const catalog = toSummaryCatalog(
    [
      {
        id: "brief-1",
        slug: "brief-1",
        title: "业务问答实践",
        description: "基于公开来源的简短概要。",
        contentType: "case",
        caseOrg: "某制药企业（C 级匿名化，真实主体见《确认清单》，不进页面）",
        categorySlug: "medical",
        cover: "/reference/covers/brief-1.webp",
        createdAt: "2026-01-01T00:00:00Z",
        likes: 100,
        rawUsageCount: 999,
        citedNumbers: "来源营销指标",
        body: "不应存储的完整文章内容",
        internalNote: "不应存储的编辑说明",
      },
    ],
    [{ id: "medical", name: "医疗", slug: "medical", color: "#000" }],
    collectedAt,
  );
  assert.equal(catalog.items[0].organization, "某制药企业");
  assert.equal(catalog.items[0].summary, "基于公开来源的简短概要。");
  assert.equal(catalog.items[0].collectedAt, collectedAt);
  assert.equal(catalog.items[0].kind, "case");
  for (const field of [
    "body",
    "createdAt",
    "publishedAt",
    "likes",
    "rawUsageCount",
    "citedNumbers",
    "internalNote",
  ]) {
    assert.equal(Object.hasOwn(catalog.items[0], field), false, field);
  }
  assert.equal(
    catalog.items[0].sourceUrl,
    "https://solutions.fastgpt.cn/customers/medical/brief-1",
  );
});

test("solution material remains a scenario reference rather than an enterprise case", () => {
  const catalog = toSummaryCatalog(
    [
      {
        id: "reference",
        slug: "reference",
        title: "应用思路",
        description: "方案概要",
        contentType: "solution",
        caseOrg: "",
        categorySlug: "business",
        cover: "/reference/covers/reference.webp",
      },
    ],
    [],
    "2026-11-03T05:50:01.753Z",
  );
  assert.equal(catalog.items[0].kind, "reference");
  assert.equal(catalog.items[0].organization, null);
});

test("current catalog has complete source relationships, local covers, and no editorial notes", async () => {
  const catalog = JSON.parse(
    await readFile(
      new URL("../src/data/catalog.json", import.meta.url),
      "utf8",
    ),
  );
  const sourceIds = new Set(catalog.sources.map((source) => source.id));
  const categoryIds = new Set(
    catalog.categories.map((category) => category.slug),
  );
  assert.equal(
    new Set(catalog.items.map((item) => item.id)).size,
    catalog.items.length,
  );
  assert.doesNotMatch(JSON.stringify(catalog), /不进页面|确认清单/);
  for (const item of catalog.items) {
    assert(sourceIds.has(item.sourceId));
    assert(categoryIds.has(item.categorySlug));
    assert(["case", "reference"].includes(item.kind));
    assert.equal(new URL(item.sourceUrl).protocol, "https:");
    assert(Number.isFinite(Date.parse(item.collectedAt)));
    assert(item.summary.length > 0);
    assert(item.cover.startsWith("/reference/covers/"));
    await readFile(new URL(`../public${item.cover}`, import.meta.url));
  }
});
