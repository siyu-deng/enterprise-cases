import { createHash } from "node:crypto";

export function itemKey(item) {
  const url = new URL(item.sourceUrl);
  if (url.protocol !== "https:") throw new Error("SOURCE_URL_MUST_BE_HTTPS");
  url.hash = "";
  return url.href.replace(/\/$/, "");
}
export function baseline(catalog) {
  return {
    version: 1,
    initializedAt: new Date().toISOString(),
    seenKeys: [...new Set(catalog.items.map(itemKey))],
    inFlight: null,
    lastError: null,
  };
}
export function newItems(catalog, state) {
  if (state.version !== 1 || !Array.isArray(state.seenKeys))
    throw new Error("INVALID_NOTIFICATION_STATE");
  const seen = new Set(state.seenKeys);
  return catalog.items.filter((item) => {
    const key = itemKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function plain(value) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/@/g, "＠")
    .replace(/[\[\]*_`<>#]/g, "")
    .trim();
}
export function messageFor(items, catalog) {
  return (
    `## 企业 AI 落地观察｜新增 ${items.length} 条资料\n\n` +
    items
      .map((item, index) => {
        const category =
          catalog.categories.find((value) => value.slug === item.categorySlug)
            ?.name || "其他行业";
        const source =
          catalog.sources.find((value) => value.id === item.sourceId)?.name ||
          "原始来源";
        const summary = plain(item.summary);
        const brief =
          [...summary].length > 120
            ? [...summary].slice(0, 120).join("") + "…"
            : summary;
        const link = itemKey(item).replace(/\(/g, "%28").replace(/\)/g, "%29");
        return `**${index + 1}. ${plain(item.title)}**\n${item.kind === "case" ? "企业案例" : "场景参考"} · ${plain(category)} · ${plain(source)}\n${brief}\n[阅读原始来源](${link})`;
      })
      .join("\n\n") +
    "\n\n概要来自公开来源，资料类型沿用来源标记。"
  );
}
export function batchesFor(items, catalog) {
  const batches = [];
  let current = [];
  for (const item of items) {
    const proposed = [...current, item];
    if (
      current.length &&
      (proposed.length > 6 ||
        Buffer.byteLength(messageFor(proposed, catalog), "utf8") > 12000)
    ) {
      batches.push({ items: current, content: messageFor(current, catalog) });
      current = [];
    }
    current.push(item);
    if (Buffer.byteLength(messageFor(current, catalog), "utf8") > 20480)
      throw new Error("MESSAGE_TOO_LARGE");
  }
  if (current.length)
    batches.push({ items: current, content: messageFor(current, catalog) });
  return batches;
}
export function exactGroup(response, name) {
  const matches = (response.sessions || []).filter(
    (session) => session.chat_type === "group" && session.chat_name === name,
  );
  if (matches.length !== 1)
    throw new Error(
      matches.length ? "GROUP_NAME_AMBIGUOUS" : "GROUP_NOT_IN_RECENT_SESSIONS",
    );
  return matches[0];
}
export function confirmed(response) {
  return (
    response.success === true ||
    response.data?.success === true ||
    (response.errcode === 0 && response.success !== false)
  );
}
export function errorFingerprint(error) {
  return createHash("sha256").update(String(error)).digest("hex");
}
