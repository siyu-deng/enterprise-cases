import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import {
  runtimePaths,
  upstreamCatalog,
  resolveRemoteCovers,
} from "./runtime-paths.mjs";
import { prepareRuntime } from "./prepare-runtime.mjs";

test("default paths preserve the running local installation", () => {
  const paths = runtimePaths("/project", {});
  assert.equal(paths.catalogPath, "/project/src/data/catalog.json");
  assert.equal(paths.stateDir, "/project/.local");
  assert.equal(paths.coversDir, "/project/public/reference/covers");
});
test("persistent paths are independently configurable and relative paths fail closed", () => {
  const paths = runtimePaths("/release", {
    ENTERPRISE_CASES_CATALOG_PATH: "/data/catalog.json",
    ENTERPRISE_CASES_STATE_DIR: "/state",
    ENTERPRISE_CASES_COVERS_DIR: "/media",
    ENTERPRISE_CASES_MANIFEST_PATH: "/data/assets.json",
  });
  assert.equal(paths.catalogPath, "/data/catalog.json");
  assert.equal(paths.stateDir, "/state");
  assert.equal(paths.coversDir, "/media");
  assert.throws(() =>
    runtimePaths("/release", { ENTERPRISE_CASES_STATE_DIR: "relative" }),
  );
});
test("remote web profile uses HTTPS and resolves covers without putting credentials in URLs", () => {
  const upstream = upstreamCatalog({
    ENTERPRISE_CASES_CATALOG_URL: "https://data.example.com/api/catalog",
  });
  const data = resolveRemoteCovers(
    { items: [{ cover: "/reference/covers/example.webp" }] },
    upstream,
  );
  assert.equal(
    data.items[0].cover,
    "https://data.example.com/reference/covers/example.webp",
  );
  assert.throws(() =>
    upstreamCatalog({
      ENTERPRISE_CASES_CATALOG_URL: "http://data.example.com/api/catalog",
    }),
  );
  assert.throws(() =>
    upstreamCatalog({
      ENTERPRISE_CASES_CATALOG_URL:
        "https://data.example.com/api/catalog?token=example",
    }),
  );
  assert.throws(() =>
    resolveRemoteCovers(
      { items: [{ cover: "javascript:alert(1)" }] },
      upstream,
    ),
  );
});
test("runtime preparation is idempotent and never resets receipts or enables sends", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "enterprise-deploy-"));
  try {
    const root = path.join(temporary, "release");
    await mkdir(path.join(root, "src/data"), { recursive: true });
    await mkdir(path.join(root, "public/reference/covers"), {
      recursive: true,
    });
    await writeFile(
      path.join(root, "src/data/catalog.json"),
      JSON.stringify({ items: [{ sourceUrl: "https://example.com/one" }] }),
    );
    await writeFile(
      path.join(root, "public/reference/covers/one.webp"),
      "fixture",
    );
    const paths = runtimePaths(root, {
      ENTERPRISE_CASES_CATALOG_PATH: path.join(temporary, "data/catalog.json"),
      ENTERPRISE_CASES_STATE_DIR: path.join(temporary, "state"),
      ENTERPRISE_CASES_COVERS_DIR: path.join(temporary, "media"),
    });
    const first = await prepareRuntime(paths);
    assert.equal(first.catalog, "created");
    const configPath = path.join(paths.stateDir, "wecom-notifications.json");
    assert.equal(JSON.parse(await readFile(configPath, "utf8")).enabled, false);
    const statePath = path.join(paths.stateDir, "notification-state.json");
    const existing = {
      version: 1,
      seenKeys: ["https://example.com/already-notified"],
      inFlight: { keys: ["https://example.com/pending"] },
    };
    await writeFile(statePath, JSON.stringify(existing));
    const second = await prepareRuntime(paths);
    assert.equal(second.state, "preserved");
    assert.deepEqual(JSON.parse(await readFile(statePath, "utf8")), existing);
    assert.equal(
      await readFile(path.join(paths.coversDir, "one.webp"), "utf8"),
      "fixture",
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("deployment commands execute through the absolute current-release symlink", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "enterprise-current-"));
  try {
    const current = path.join(temporary, "current");
    await symlink(path.resolve(import.meta.dirname, ".."), current, "dir");
    const env = {
      ...process.env,
      ENTERPRISE_CASES_CATALOG_PATH: path.join(temporary, "data/catalog.json"),
      ENTERPRISE_CASES_STATE_DIR: path.join(temporary, "state"),
      ENTERPRISE_CASES_COVERS_DIR: path.join(temporary, "covers"),
      ENTERPRISE_CASES_MANIFEST_PATH: path.join(temporary, "manifest.json"),
    };
    const invoke = (file) => JSON.parse(execFileSync(process.execPath, [
      path.join(current, "scripts", file),
    ], { env, encoding: "utf8", timeout: 10000 }));
    assert.equal(invoke("prepare-runtime.mjs").status, "prepared");
    assert.equal(invoke("notify-new-data.mjs").status, "disabled");
    const config = JSON.parse(await readFile(path.join(env.ENTERPRISE_CASES_STATE_DIR, "wecom-notifications.json"), "utf8"));
    assert.equal(config.enabled, false);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
