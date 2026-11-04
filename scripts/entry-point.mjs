import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function isMain(moduleUrl) {
  if (!process.argv[1]) return false;
  try {
    return pathToFileURL(realpathSync(process.argv[1])).href === moduleUrl;
  } catch {
    return false;
  }
}
