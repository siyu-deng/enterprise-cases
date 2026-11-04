import { mkdir, readFile, writeFile, cp, chmod } from "node:fs/promises";
import path from "node:path";
import { isMain } from "./entry-point.mjs";
import { runtimePaths } from "./runtime-paths.mjs";
import { baseline } from "./notification-core.mjs";

async function createOnly(file, value, mode = 0o600) {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  try {
    await writeFile(file, JSON.stringify(value, null, 2) + "\n", {
      flag: "wx",
      mode,
    });
    return "created";
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    return "preserved";
  }
}
export async function prepareRuntime(paths) {
  await mkdir(path.dirname(paths.catalogPath), {
    recursive: true,
    mode: 0o755,
  });
  const seedPath = path.join(paths.root, "src/data/catalog.json");
  const seed = JSON.parse(await readFile(seedPath, "utf8"));
  const catalog = await createOnly(paths.catalogPath, seed, 0o644);
  await mkdir(paths.coversDir, { recursive: true, mode: 0o755 });
  await chmod(paths.coversDir, 0o755);
  const seedCovers = path.join(paths.root, "public/reference/covers");
  if (path.resolve(seedCovers) !== path.resolve(paths.coversDir)) {
    await cp(seedCovers, paths.coversDir, {
      recursive: true,
      force: false,
      errorOnExist: false,
    });
  }
  await mkdir(paths.stateDir, { recursive: true, mode: 0o700 });
  const current = JSON.parse(await readFile(paths.catalogPath, "utf8"));
  const state = await createOnly(
    path.join(paths.stateDir, "notification-state.json"),
    baseline(current),
  );
  const config = await createOnly(
    path.join(paths.stateDir, "wecom-notifications.json"),
    {
      version: 1,
      enabled: false,
      groupName: "ai宠物专项",
      scope: "new-source-urls-only",
      intervalMinutes: 5,
    },
  );
  return {
    status: "prepared",
    catalog,
    state,
    config,
    records: current.items.length,
    notificationsEnabledByPreparation: false,
  };
}
if (isMain(import.meta.url)) {
  if (process.env.VERCEL) {
    console.error(
      "Persistent worker preparation is not supported inside Vercel Functions.",
    );
    process.exitCode = 1;
  } else
    console.log(
      JSON.stringify(
        await prepareRuntime(
          runtimePaths(path.resolve(import.meta.dirname, "..")),
        ),
      ),
    );
}
