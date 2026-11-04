import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { isMain } from "./entry-point.mjs";

const root = path.resolve(import.meta.dirname, "..");
const runtimeOverrides = [
  "ENTERPRISE_CASES_CATALOG_PATH",
  "ENTERPRISE_CASES_STATE_DIR",
  "ENTERPRISE_CASES_COVERS_DIR",
  "ENTERPRISE_CASES_MANIFEST_PATH",
  "ENTERPRISE_CASES_CATALOG_URL",
  "ENTERPRISE_CASES_CATALOG_TOKEN",
];

// Only reads local configuration; never invokes the collector or messaging CLI.
export async function checkEnvironment({
  projectRoot = root,
  nodeVersion = process.versions.node,
  userAgent = process.env.npm_config_user_agent || "",
  environment = process.env,
  gitVersion = () =>
    execFileSync("git", ["--version"], {
      encoding: "utf8",
      timeout: 5000,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim(),
} = {}) {
  const errors = [];
  const [major, minor] = nodeVersion.split(".").map(Number);
  if (major !== 22 || minor < 14)
    errors.push("请使用 Node.js 22.14.0（nvm install && nvm use）。");
  if (!/(?:^|\s)pnpm\/10\.19\.0(?:\s|$)/.test(userAgent))
    errors.push("请通过 pnpm 10.19.0 执行 pnpm run doctor。");
  let git;
  try {
    git = gitVersion();
  } catch {
    errors.push("未找到 Git，请先安装 Xcode Command Line Tools。");
  }
  if (runtimeOverrides.some((name) => Boolean(environment[name])))
    errors.push("检测到运行环境覆盖。本地初始化前请取消 ENTERPRISE_CASES_* 配置，保留本地隔离。");
  try {
    const config = JSON.parse(
      await readFile(
        path.join(projectRoot, ".local/wecom-notifications.json"),
        "utf8",
      ),
    );
    if (config.enabled !== false)
      errors.push("本地企微发送未明确关闭，请先将本地配置 enabled 设为 false。");
  } catch (error) {
    if (error.code !== "ENOENT")
      errors.push("本地通知配置不可读，请人工检查 .local 配置。");
  }
  return { status: errors.length ? "not_ready" : "ready", node: nodeVersion, git, errors };
}

if (isMain(import.meta.url)) {
  const result = await checkEnvironment();
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
}
