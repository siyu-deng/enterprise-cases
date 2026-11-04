import { execFileSync } from "node:child_process";
import path from "node:path";
import { root, local, readJson, atomicJson, withLock } from "./local-state.mjs";
import { errorFingerprint } from "./notification-core.mjs";

const statusPath = path.join(local, "monitor-status.json");
if (process.env.VERCEL) {
  console.log(
    JSON.stringify({
      status: "needs_attention",
      reason: "PERSISTENT_WORKER_NOT_SUPPORTED_IN_VERCEL_FUNCTIONS",
      newError: true,
    }),
  );
  process.exit(1);
}
const result = await withLock("monitor", async () => {
  let previous = {};
  try {
    previous = await readJson(statusPath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    const output = execFileSync(
      process.execPath,
      [path.join(root, "scripts/import-reference.mjs")],
      {
        cwd: root,
        encoding: "utf8",
        timeout: 240000,
        maxBuffer: 2 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const result = JSON.parse(output.trim().split("\n").at(-1));
    await atomicJson(statusPath, {
      checkedAt: new Date().toISOString(),
      status: result.status,
      lastError: null,
    });
    return result;
  } catch {
    const fingerprint = errorFingerprint(
      "COLLECTION_OR_NOTIFICATION_CHECK_FAILED",
    );
    await atomicJson(statusPath, {
      checkedAt: new Date().toISOString(),
      status: "needs_attention",
      lastError: fingerprint,
    });
    return {
      status: "needs_attention",
      reason: "COLLECTION_OR_NOTIFICATION_CHECK_FAILED",
      newError: previous.lastError !== fingerprint,
    };
  }
});
console.log(JSON.stringify(result));
if (process.argv.includes("--service") && result.status === "needs_attention")
  process.exitCode = 1;
