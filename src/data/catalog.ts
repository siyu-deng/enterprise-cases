import snapshot from "./catalog.json";

export type BriefKind = "case" | "reference";
export type KindFilter = "all" | BriefKind;
export type SortKey = "case-first" | "newest" | "title";
export type Category = { id: string; name: string; slug: string };
export type Source = {
  id: string;
  name: string;
  url: string;
  description: string;
  collectedAt: string;
};
export type SourceBrief = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  kind: BriefKind;
  organization: string | null;
  categorySlug: string;
  sourceId: string;
  sourceUrl: string;
  cover: string;
  collectedAt: string;
  category: Category;
  source: Source;
};
export type CatalogSnapshot = typeof snapshot;
export const catalogSnapshot = snapshot;
export const kindLabels: Record<BriefKind, string> = {
  case: "企业案例",
  reference: "场景参考",
};
export const sortLabels: Record<SortKey, string> = {
  "case-first": "企业案例优先",
  newest: "最近收录",
  title: "标题排序",
};
export function createCatalog(data: CatalogSnapshot) {
  if (
    data.schemaVersion !== 2 ||
    !Array.isArray(data.items) ||
    !Array.isArray(data.sources) ||
    !Array.isArray(data.categories)
  )
    throw new Error("Invalid catalog");
  const categories: Category[] = data.categories;
  const sources: Source[] = data.sources;
  for (const source of sources) {
    if (new URL(source.url).protocol !== "https:")
      throw new Error("Invalid source URL");
  }
  const briefs: SourceBrief[] = data.items.map((item) => {
    if (
      !["case", "reference"].includes(item.kind) ||
      typeof item.title !== "string" ||
      typeof item.summary !== "string" ||
      new URL(item.sourceUrl).protocol !== "https:"
    )
      throw new Error("Invalid source brief");
    const category = categories.find(
      (value) => value.slug === item.categorySlug,
    );
    const source = sources.find((value) => value.id === item.sourceId);
    if (!category || !source)
      throw new Error(`Missing category or source for ${item.id}`);
    return {
      ...item,
      kind: item.kind === "case" ? "case" : "reference",
      category,
      source,
    };
  });
  const catalogStats = {
    total: briefs.length,
    cases: briefs.filter((item) => item.kind === "case").length,
    references: briefs.filter((item) => item.kind === "reference").length,
    industries: new Set(briefs.map((item) => item.categorySlug)).size,
    sources: sources.length,
  };

  return { categories, sources, briefs, catalogStats };
}
export const { categories, sources, briefs, catalogStats } =
  createCatalog(snapshot);

export function filterBriefs(
  {
    category,
    query,
    kind,
    sort,
  }: {
    category: string;
    query: string;
    kind: KindFilter;
    sort: SortKey;
  },
  records: SourceBrief[] = briefs,
) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return records
    .filter((item) => {
      if (category !== "all" && item.categorySlug !== category) return false;
      if (kind !== "all" && item.kind !== kind) return false;
      const content =
        `${item.title} ${item.summary} ${item.organization || ""} ${item.category.name} ${item.source.name}`.toLocaleLowerCase();
      return terms.every((term) => content.includes(term));
    })
    .sort((a, b) => {
      if (sort === "case-first" && a.kind !== b.kind)
        return a.kind === "case" ? -1 : 1;
      if (sort === "newest")
        return (
          b.collectedAt.localeCompare(a.collectedAt) ||
          a.title.localeCompare(b.title, "zh-CN")
        );
      return a.title.localeCompare(b.title, "zh-CN");
    });
}

const dateFormat = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Shanghai",
});
export function formatCollectedAt(value: string) {
  return dateFormat.format(new Date(value));
}
