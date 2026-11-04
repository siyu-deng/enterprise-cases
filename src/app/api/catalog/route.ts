import { readFile } from "node:fs/promises";
import { createCatalog } from "@/data/catalog";
import {
  runtimePaths,
  upstreamCatalog,
  resolveRemoteCovers,
} from "../../../../scripts/runtime-paths.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const upstream = upstreamCatalog();
    let catalog;
    if (upstream) {
      const token = process.env.ENTERPRISE_CASES_CATALOG_TOKEN;
      const response = await fetch(upstream, {
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Catalog upstream unavailable");
      catalog = resolveRemoteCovers(await response.json(), upstream);
    } else {
      catalog = JSON.parse(
        await readFile(runtimePaths(process.cwd()).catalogPath, "utf8"),
      );
    }
    createCatalog(catalog);
    return Response.json(catalog, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "资料暂时无法更新" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
