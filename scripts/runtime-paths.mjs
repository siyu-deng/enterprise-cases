import path from "node:path";

export function runtimePaths(projectRoot, environment = process.env) {
  const root = path.resolve(projectRoot);
  function configured(name, fallback) {
    const value = environment[name];
    if (!value) return fallback;
    if (!path.isAbsolute(value)) throw new Error(`${name}_MUST_BE_ABSOLUTE`);
    return path.normalize(value);
  }
  return {
    root,
    catalogPath: configured(
      "ENTERPRISE_CASES_CATALOG_PATH",
      path.join(root, "src/data/catalog.json"),
    ),
    stateDir: configured(
      "ENTERPRISE_CASES_STATE_DIR",
      path.join(root, ".local"),
    ),
    coversDir: configured(
      "ENTERPRISE_CASES_COVERS_DIR",
      path.join(root, "public/reference/covers"),
    ),
    manifestPath: configured(
      "ENTERPRISE_CASES_MANIFEST_PATH",
      path.join(root, "docs/reference/asset-manifest.json"),
    ),
  };
}

export function upstreamCatalog(environment = process.env) {
  const value = environment.ENTERPRISE_CASES_CATALOG_URL;
  if (!value) return null;
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      "CATALOG_UPSTREAM_MUST_BE_HTTPS_WITHOUT_CREDENTIALS_OR_QUERY",
    );
  return url;
}

export function resolveRemoteCovers(catalog, upstream) {
  return {
    ...catalog,
    items: catalog.items.map((item) => {
      if (typeof item.cover !== "string") throw new Error("INVALID_COVER");
      const cover = new URL(item.cover, upstream);
      if (cover.protocol !== "https:")
        throw new Error("REMOTE_COVER_MUST_BE_HTTPS");
      return { ...item, cover: cover.href };
    }),
  };
}
