// Read-only upstream collection; local upsert followed by explicitly configured notifications.
import { mkdir, writeFile, access, chmod } from "node:fs/promises";
import path from "node:path";
import { toSummaryCatalog, mergeSummaryCatalog } from "./catalog-format.mjs";
import { atomicJson, readJson, paths } from "./local-state.mjs";
import { notifyNewData } from "./notify-new-data.mjs";

const origin = "https://solutions.fastgpt.cn";
const base = `${origin}/customers`;
async function read(url, binary = false) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${response.status} reading ${url}`);
  return binary ? Buffer.from(await response.arrayBuffer()) : response.text();
}
async function pool(items, fn) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: 5 }, async () => {
      while (queue.length) await fn(queue.shift());
    }),
  );
}

const html = await read(base);
const streams = [...html.matchAll(/self\.__next_f\.push\((.*?)\)<\/script>/gs)]
  .map((match) => JSON.parse(match[1]))
  .filter((item) => typeof item[1] === "string")
  .map((item) => item[1])
  .join("");
const initialLine = streams
  .split("\n")
  .find((line) => line.includes('"initialCategories":'));
if (!initialLine)
  throw new Error("Reference page format changed: no initial data");
const initial = JSON.parse(initialLine.slice(initialLine.indexOf(":") + 1))[3];
const first = JSON.parse(
  await read(`${base}/api/customers?limit=60&page=1&sortBy=usage`),
);
if (first.pagination.totalPages > 3)
  throw new Error("Import exceeded the bounded three-page scope");
const solutions = [...first.solutions];
for (let page = 2; page <= first.pagination.totalPages; page++) {
  const next = JSON.parse(
    await read(`${base}/api/customers?limit=60&page=${page}&sortBy=usage`),
  );
  solutions.push(...next.solutions);
}
if (
  solutions.length !== first.pagination.total ||
  new Set(solutions.map((s) => s.id)).size !== solutions.length
) {
  throw new Error(
    "Reference pagination changed during import; no catalog written",
  );
}

const assets = new Map();
for (const s of solutions) {
  const remote = s.thumbnailUrl || s.imageUrl;
  const ext = path.extname(new URL(remote).pathname) || ".jpg";
  const local = `/reference/covers/${s.slug}${ext}`;
  assets.set(local, remote);
  s.cover = local;
  s.sourceUrl = `${base}/${s.categorySlug}/${s.slug}`;
}
await pool([...assets], async ([local, remote]) => {
  const target = path.join(paths.coversDir, path.basename(local));
  try {
    await access(target);
    return;
  } catch {
    /* Download newly encountered covers only. */
  }
  const data = await read(remote, true);
  await mkdir(path.dirname(target), { recursive: true, mode: 0o755 });
  await writeFile(target, data);
  await chmod(target, 0o644);
});
const incoming = toSummaryCatalog(
  solutions,
  initial.initialCategories,
  new Date().toISOString(),
);
const catalogPath = paths.catalogPath;
let previous;
try {
  previous = await readJson(catalogPath);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const catalog = mergeSummaryCatalog(previous, incoming);
await atomicJson(catalogPath, catalog, 0o644);
await atomicJson(paths.manifestPath, Object.fromEntries(assets), 0o644);
console.log(
  `Imported ${catalog.items.length} source summaries, ${catalog.categories.length} categories, ${assets.size} covers.`,
);
console.log(JSON.stringify(await notifyNewData({ send: true })));
