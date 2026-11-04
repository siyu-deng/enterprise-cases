import path from "node:path";
import { isMain } from "./entry-point.mjs";
import { execFileSync } from "node:child_process";
import {
  paths,
  local,
  readJson,
  atomicJson,
  withLock,
} from "./local-state.mjs";
import {
  baseline,
  newItems,
  batchesFor,
  itemKey,
  exactGroup,
  confirmed,
  errorFingerprint,
} from "./notification-core.mjs";

const statePath = path.join(local, "notification-state.json");
const configPath = path.join(local, "wecom-notifications.json");
function cli(args) {
  try {
    return execFileSync("wecom-cli", args, {
      encoding: "utf8",
      timeout: 45000,
      maxBuffer: 2 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    throw new Error("WECOM_CLI_REQUEST_FAILED");
  }
}
export async function initialize() {
  try {
    await readJson(statePath);
    return { status: "baseline_exists" };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const catalog = await readJson(paths.catalogPath);
  const state = baseline(catalog);
  await atomicJson(statePath, state);
  return {
    status: "baseline_initialized",
    baselineCount: state.seenKeys.length,
  };
}
export async function notifyNewData({ send = false } = {}) {
  return withLock("notifications", async () => {
    let config;
    try {
      config = await readJson(configPath);
    } catch (error) {
      if (error.code === "ENOENT") return { status: "disabled" };
      throw error;
    }
    if (!config.enabled) return { status: "disabled" };
    const state = await readJson(statePath);
    const fail = async (code) => {
      const fingerprint = errorFingerprint(code);
      const newError = state.lastError !== fingerprint;
      state.lastError = fingerprint;
      await atomicJson(statePath, state);
      return { status: "needs_attention", reason: code, newError };
    };
    if (state.inFlight) return fail("DELIVERY_UNCERTAIN_REVIEW_BEFORE_RETRY");
    const catalog = await readJson(paths.catalogPath);
    const items = newItems(catalog, state);
    if (!items.length) {
      if (state.lastError) {
        state.lastError = null;
        await atomicJson(statePath, state);
      }
      return { status: "unchanged", newCount: 0 };
    }
    const batches = batchesFor(items, catalog);
    if (!send)
      return {
        status: "preview",
        newCount: items.length,
        messages: batches.map((batch) => batch.content),
      };
    let group;
    try {
      const version = cli(["--version"]).match(
        /wecom-cli\s+(\d+)\.(\d+)\.(\d+)/,
      );
      if (
        !version ||
        Number(version[1]) < 1 ||
        (Number(version[1]) === 1 && Number(version[2]) < 1)
      )
        throw new Error("WECOM_CLI_VERSION_UNSUPPORTED");
      if (cli(["auth", "show", "--status"]) !== "authorized")
        throw new Error("WECOM_AUTH_REQUIRED");
      group = exactGroup(
        JSON.parse(cli(["message", "aibot", "sessions", "list"])),
        config.groupName,
      );
    } catch (error) {
      return fail(error.message);
    }
    let sentCount = 0;
    for (const batch of batches) {
      // Persist intent before the external side effect. Unknown results are never auto-retried.
      state.inFlight = {
        keys: batch.items.map(itemKey),
        startedAt: new Date().toISOString(),
        groupName: config.groupName,
      };
      await atomicJson(statePath, state);
      try {
        const response = JSON.parse(
          cli([
            "message",
            "aibot",
            "send",
            "--json",
            JSON.stringify({
              chat_id: group.chat_id,
              msg_type: "markdown",
              markdown: { content: batch.content },
            }),
          ]),
        );
        if (!confirmed(response))
          throw new Error("WECOM_DELIVERY_NOT_CONFIRMED");
      } catch {
        return fail("DELIVERY_UNCERTAIN_REVIEW_BEFORE_RETRY");
      }
      state.seenKeys = [
        ...new Set([...state.seenKeys, ...batch.items.map(itemKey)]),
      ];
      state.inFlight = null;
      state.lastError = null;
      state.lastSentAt = new Date().toISOString();
      await atomicJson(statePath, state);
      sentCount += batch.items.length;
    }
    return {
      status: "sent",
      newCount: sentCount,
      messageCount: batches.length,
      target: config.groupName,
    };
  });
}
if (isMain(import.meta.url)) {
  const args = new Set(process.argv.slice(2));
  try {
    console.log(
      JSON.stringify(
        args.has("--init")
          ? await initialize()
          : await notifyNewData({ send: args.has("--send") }),
      ),
    );
  } catch {
    console.log(
      JSON.stringify({
        status: "needs_attention",
        reason: "NOTIFICATION_CONFIGURATION_OR_STATE_ERROR",
        newError: true,
      }),
    );
    process.exitCode = 1;
  }
}
