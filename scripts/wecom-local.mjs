import { execFileSync, spawnSync } from "node:child_process";
import { homedir } from "node:os";
import path from "node:path";
import { isMain } from "./entry-point.mjs";

// This entry point can only authorize/check a separate local CLI profile.
// Collection and message sending are intentionally absent.
export function localCliEnvironment(environment = process.env, home = homedir()) {
  const configured = environment.WECOM_CLI_CONFIG_DIR;
  if (!configured) throw new Error("请先把单独交付的 .env.local 放到项目根目录。");
  const expanded = configured.startsWith("~/")
    ? path.join(home, configured.slice(2))
    : configured;
  const expected = path.join(home, ".config/wecom-enterprise-cases");
  if (!path.isAbsolute(expanded) || path.resolve(expanded) !== expected)
    throw new Error("本地授权仅使用独立目录 ~/.config/wecom-enterprise-cases。");
  if (environment.WECOM_CLI_ACCESS_TOKEN?.trim())
    throw new Error("本地扫码接入不使用外部 token，请取消 WECOM_CLI_ACCESS_TOKEN。");
  return { ...environment, WECOM_CLI_CONFIG_DIR: expected };
}

export function runLocalWecom(mode, {
  environment = process.env,
  home = homedir(),
  execute = execFileSync,
  initialize = spawnSync,
} = {}) {
  if (!["auth", "status"].includes(mode)) throw new Error("仅支持 auth 或 status。");
  const env = localCliEnvironment(environment, home);
  const cli = (args) => execute("wecom-cli", args, {
    env,
    encoding: "utf8",
    timeout: 15000,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  const version = cli(["--version"]).match(/wecom-cli\s+(\d+)\.(\d+)/);
  if (!version || Number(version[1]) < 1 || (Number(version[1]) === 1 && Number(version[2]) < 1))
    throw new Error("请按交接说明安装 wecom-cli 1.2.0。");
  const status = () => {
    const value = cli(["auth", "show", "--status"]);
    if (!["authorized", "unauthorized"].includes(value))
      throw new Error("CLI 授权状态无法确认。");
    return value;
  };
  const before = status();
  if (mode === "status" || before === "authorized")
    return { status: before, initialized: false, messagesSent: 0 };
  const result = initialize("wecom-cli", ["auth", "init", "--noninteractive"], {
    env,
    stdio: "inherit",
    timeout: 330000,
  });
  if (result.error || result.status !== 0)
    throw new Error("扫码授权未完成，请按单独的企微接入说明处理。");
  const after = status();
  if (after !== "authorized") throw new Error("扫码后仍未授权。");
  return { status: after, initialized: true, messagesSent: 0 };
}

if (isMain(import.meta.url)) {
  try {
    console.log(JSON.stringify(runLocalWecom(process.argv[2])));
  } catch {
    console.error("企微本地接入未完成：请检查独立 .env.local、CLI 安装和扫码结果，详见 docs/handoff/wecom-local.md；未执行消息发送。");
    process.exitCode = 1;
  }
}
