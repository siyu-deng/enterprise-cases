import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { checkEnvironment } from "./check-environment.mjs";

async function fixture(t) {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "cases-doctor-"));
  t.after(() => rm(projectRoot, { recursive: true, force: true }));
  return {
    projectRoot,
    nodeVersion: "22.14.0",
    userAgent: "pnpm/10.19.0 node/v22.14.0 darwin arm64",
    environment: {},
    gitVersion: () => "git version fixture",
  };
}

test("fresh clone is ready without notification state, credentials, or a messaging CLI", async (t) => {
  const input = await fixture(t);
  assert.equal((await checkEnvironment(input)).status, "ready");
  for (const patch of [
    { nodeVersion: "20.18.1" },
    { nodeVersion: "22.13.1" },
    { userAgent: "pnpm/12.0.0" },
    { gitVersion: () => { throw new Error("missing"); } },
  ])
    assert.equal((await checkEnvironment({ ...input, ...patch })).status, "not_ready");
});

test("setup refuses enabled notifications and runtime overrides without disclosing their values", async (t) => {
  const input = await fixture(t);
  await mkdir(path.join(input.projectRoot, ".local"));
  const file = path.join(input.projectRoot, ".local/wecom-notifications.json");
  await writeFile(file, JSON.stringify({ enabled: true }));
  assert.equal((await checkEnvironment(input)).status, "not_ready");
  await writeFile(file, JSON.stringify({ enabled: false }));
  assert.equal((await checkEnvironment(input)).status, "ready");
  const result = await checkEnvironment({ ...input, environment: {
    ENTERPRISE_CASES_CATALOG_TOKEN: "private-fixture-value",
  } });
  assert.equal(result.status, "not_ready");
  assert(!JSON.stringify(result).includes("private-fixture-value"));
  await writeFile(file, "invalid json");
  assert.equal((await checkEnvironment(input)).status, "not_ready");
});
