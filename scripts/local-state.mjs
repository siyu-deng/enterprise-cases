import {
  mkdir,
  writeFile,
  rename,
  readFile,
  unlink,
  open,
} from "node:fs/promises";
import path from "node:path";
import { runtimePaths } from "./runtime-paths.mjs";
export const root = path.resolve(import.meta.dirname, "..");
export const paths = runtimePaths(root);
export const local = paths.stateDir;
export async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}
export async function atomicJson(file, value, mode = 0o600) {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + "\n", { mode });
  await rename(temp, file);
}
export async function withLock(name, action) {
  await mkdir(local, { recursive: true, mode: 0o700 });
  const file = path.join(local, `${name}.lock`);
  let handle;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      handle = await open(file, "wx", 0o600);
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      const owner = Number(await readFile(file, "utf8"));
      if (!Number.isInteger(owner) || owner <= 0)
        throw new Error("INVALID_LOCK_REQUIRES_REVIEW");
      try {
        process.kill(owner, 0);
        return { status: "already_running" };
      } catch (e) {
        if (e.code !== "ESRCH") return { status: "already_running" };
        await unlink(file);
      }
    }
  }
  if (!handle) return { status: "already_running" };
  try {
    await handle.writeFile(String(process.pid));
    return await action();
  } finally {
    await handle.close();
    await unlink(file);
  }
}
