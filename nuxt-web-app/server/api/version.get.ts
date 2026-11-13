import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export default defineEventHandler(async () => {
  const versionFile = resolve(process.cwd(), "VERSION");
  return (await readFile(versionFile, "utf8")).trim();
});
