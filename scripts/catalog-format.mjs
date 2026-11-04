// Persist only source summaries. Source record dates are not article publication dates.
export function toSummaryCatalog(rawItems, rawCategories, collectedAt) {
  const source = {
    id: "fastgpt",
    name: "FastGPT",
    url: "https://solutions.fastgpt.cn/customers",
    description: "企业实践介绍与业务场景方案的公开资料。",
    collectedAt,
  };
  return {
    schemaVersion: 2,
    sources: [source],
    categories: rawCategories.map(({ id, name, slug }) => ({ id, name, slug })),
    items: rawItems.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      summary: item.description,
      kind: item.contentType === "case" ? "case" : "reference",
      organization:
        item.caseOrg?.replace(/（[ABC]\s*级[^）]*）/g, "").trim() || null,
      categorySlug: item.categorySlug,
      sourceId: source.id,
      sourceUrl:
        item.sourceUrl || `${source.url}/${item.categorySlug}/${item.slug}`,
      cover: item.cover,
      collectedAt,
    })),
  };
}

export function mergeSummaryCatalog(previous, incoming) {
  if (!previous) return incoming;
  if (previous.schemaVersion !== 2 || !Array.isArray(previous.items))
    throw new Error("INVALID_PREVIOUS_CATALOG");
  const key = (item) =>
    `${item.sourceId}|${new URL(item.sourceUrl).href.replace(/\/$/, "")}`;
  const items = new Map(previous.items.map((item) => [key(item), item]));
  for (const item of incoming.items) {
    const old = items.get(key(item));
    items.set(key(item), {
      ...item,
      collectedAt: old?.collectedAt || item.collectedAt,
    });
  }
  return {
    schemaVersion: 2,
    sources: [
      ...new Map(
        [...previous.sources, ...incoming.sources].map((source) => [
          source.id,
          source,
        ]),
      ).values(),
    ],
    categories: [
      ...new Map(
        [...previous.categories, ...incoming.categories].map((category) => [
          category.slug,
          category,
        ]),
      ).values(),
    ],
    items: [...items.values()],
  };
}
