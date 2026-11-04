import test from "node:test";
import assert from "node:assert/strict";
import {
  baseline,
  newItems,
  batchesFor,
  itemKey,
  exactGroup,
  confirmed,
} from "./notification-core.mjs";
import { mergeSummaryCatalog } from "./catalog-format.mjs";

const item = (name) => ({
  id: name,
  title: name,
  sourceUrl: `https://example.com/${name}`,
  summary: "一段公开资料概要 @all",
  sourceId: "source",
  categorySlug: "education",
  kind: "reference",
  collectedAt: "2026-11-03T00:00:00Z",
});
const catalog = (items) => ({
  schemaVersion: 2,
  items,
  categories: [{ slug: "education", name: "教育" }],
  sources: [{ id: "source", name: "公开来源" }],
});
test("baseline does not backfill existing records and edits do not notify", () => {
  const before = catalog([item("one")]);
  const state = baseline(before);
  assert.deepEqual(newItems(before, state), []);
  const edited = { ...item("one"), id: "changed-id", summary: "修改概要" };
  assert.equal(newItems(catalog([edited]), state).length, 0);
});
test("new originals are deduplicated and confirmed records do not repeat", () => {
  const state = baseline(catalog([item("one")]));
  const data = catalog([
    item("one"),
    item("two"),
    { ...item("two"), id: "other" },
  ]);
  const fresh = newItems(data, state);
  assert.equal(fresh.length, 1);
  state.seenKeys.push(itemKey(fresh[0]));
  assert.equal(newItems(data, state).length, 0);
});
test("messages fit byte budget, preserve original links and neutralize mass mentions", () => {
  const data = catalog(Array.from({ length: 13 }, (_, i) => item(String(i))));
  const batches = batchesFor(data.items, data);
  assert.deepEqual(
    batches.map((b) => b.items.length),
    [6, 6, 1],
  );
  for (const batch of batches) {
    assert(Buffer.byteLength(batch.content, "utf8") < 20480);
    assert(!batch.content.includes("@all"));
    assert(batch.content.includes("https://example.com/"));
    assert(!batch.content.includes("127.0.0.1"));
  }
});
test("only a unique freshly listed exact-name group is accepted", () => {
  const response = {
    sessions: [{ chat_name: "指定群", chat_type: "group", chat_id: "fixture" }],
  };
  assert.equal(exactGroup(response, "指定群").chat_name, "指定群");
  assert.throws(() => exactGroup(response, "另一个群"));
  assert.throws(() =>
    exactGroup(
      { sessions: [...response.sessions, ...response.sessions] },
      "指定群",
    ),
  );
  assert.equal(confirmed({ success: true }), true);
  assert.equal(confirmed({ success: false }), false);
  assert.equal(confirmed({}), false);
});
test("collection upsert preserves first collection dates, withdrawn records and other sources", () => {
  const first = catalog([
    item("one"),
    { ...item("private"), sourceId: "other" },
  ]);
  const later = catalog([
    { ...item("one"), summary: "新概要", collectedAt: "2026-11-04T00:00:00Z" },
    item("two"),
  ]);
  const merged = mergeSummaryCatalog(first, later);
  assert.equal(merged.items.length, 3);
  assert.equal(
    merged.items.find((i) => i.id === "one").collectedAt,
    first.items[0].collectedAt,
  );
  assert.equal(merged.items.find((i) => i.id === "one").summary, "新概要");
  assert(merged.items.some((i) => i.sourceId === "other"));
});
