import { access, constants } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { root, paths, readJson } from "./local-state.mjs";
import { exactGroup } from "./notification-core.mjs";

const errors = [];
const result = {
  profile: "persistent-worker",
  node: process.versions.node,
  checks: [],
};
if (process.env.VERCEL)
  errors.push(
    "Persistent collection and CLI worker must run outside Vercel Functions.",
  );
if (Number(process.versions.node.split(".")[0]) < 22)
  errors.push("Deployment profile requires Node.js 22 or newer.");
for (const [name, file] of Object.entries({
  catalog: paths.catalogPath,
  state: paths.stateDir,
  covers: paths.coversDir,
})) {
  try {
    await access(file, constants.R_OK | constants.W_OK);
    result.checks.push(`${name}:read-write`);
  } catch {
    errors.push(`${name}:not-readable-or-writable`);
  }
}
try {
  const state = await readJson(
    path.join(paths.stateDir, "notification-state.json"),
  );
  if (state.inFlight)
    errors.push(
      "Uncertain delivery requires review before enabling the timer.",
    );
  const config = await readJson(
    path.join(paths.stateDir, "wecom-notifications.json"),
  );
  if (!config.enabled)
    errors.push(
      "Notifications remain disabled; authorize and review before enabling.",
    );
  const cli = (args) =>
    execFileSync("wecom-cli", args, {
      encoding: "utf8",
      cwd: root,
      timeout: 30000,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const version = cli(["--version"]).match(/wecom-cli\s+(\d+)\.(\d+)/);
  if (
    !version ||
    Number(version[1]) < 1 ||
    (Number(version[1]) === 1 && Number(version[2]) < 1)
  )
    throw new Error("Unsupported CLI version");
  if (cli(["auth", "show", "--status"]) !== "authorized")
    throw new Error("Authorization required");
  exactGroup(
    JSON.parse(cli(["message", "aibot", "sessions", "list"])),
    config.groupName,
  );
  result.checks.push("cli:authorized-and-exact-group-available");
} catch {
  errors.push(
    "CLI, exact target group, or persistent notification state requires setup.",
  );
}
console.log(
  JSON.stringify({
    ...result,
    status: errors.length ? "not_ready" : "ready",
    errors,
    messagesSent: 0,
  }),
);
if (errors.length) process.exitCode = 1;
