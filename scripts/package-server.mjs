import { access, cp, mkdir, readdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const output = process.argv[2];
if (process.platform !== "linux" || process.arch !== "x64")
  throw new Error("Build and package the server release on Linux x64.");
if (!output || !path.isAbsolute(output) || output.startsWith(root + path.sep))
  throw new Error("Provide a new absolute output directory outside the source tree.");
await access(path.join(root, ".next/standalone/server.js"));
await mkdir(output);
const copy = (from, to) =>
  cp(path.join(root, from), path.join(output, to), {
    recursive: true,
    force: false,
    errorOnExist: true,
    verbatimSymlinks: true,
  });
await copy(".next/standalone", ".");
await copy(".next/static", ".next/static");
await copy("public", "public");
await mkdir(path.join(output, "scripts"), { recursive: true });
for (const file of await readdir(path.join(root, "scripts")))
  if (file.endsWith(".mjs") && !file.endsWith(".test.mjs"))
    await copy(`scripts/${file}`, `scripts/${file}`);
const seed = "src/data/catalog.json";
try {
  const [source, traced] = await Promise.all([
    readFile(path.join(root, seed)),
    readFile(path.join(output, seed)),
  ]);
  if (!source.equals(traced)) throw new Error("Traced catalog differs from the source seed.");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  await copy(seed, seed);
}
await copy("deploy/server", "deploy/server");
await mkdir(path.join(output, ".next/cache"), { recursive: true });
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
await writeFile(
  path.join(output, "release.json"),
  JSON.stringify({
    version: pkg.version,
    platform: process.platform,
    arch: process.arch,
    node: process.versions.node,
    packagedAt: new Date().toISOString(),
  }, null, 2) + "\n",
);
for (const entry of await readdir(output, { recursive: true, withFileTypes: true })) {
  if (!entry.isSymbolicLink()) continue;
  const target = await realpath(path.join(entry.parentPath, entry.name));
  if (!target.startsWith(output + path.sep))
    throw new Error("Release contains a dependency outside the release directory.");
}
console.log(JSON.stringify({ status: "packaged", version: pkg.version }));
