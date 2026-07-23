import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const sourcePath = path.join(projectDirectory, "data", "mappable-records1.json");
const outputPath = path.join(projectDirectory, "HTML", "shadcn", "libraries-data.js");

const records = JSON.parse(await readFile(sourcePath, "utf8"));
const browserSnapshot = [
  "// Generated from ../../data/mappable-records1.json. Do not edit by hand.",
  `window.MAPPABLE_LIBRARIES = ${JSON.stringify(records, null, 2)};`,
  "",
].join("\n");

await writeFile(outputPath, browserSnapshot, "utf8");
console.log(`Wrote ${records.length} complete library records to ${outputPath}`);
