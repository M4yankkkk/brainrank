/**
 * Dumps the live OpenAPI document to openapi/openapi.json, so the Flutter app
 * (built later, against this same API) can generate a typed client from it.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { buildApp } from "../src/app.js";

async function main() {
  const app = buildApp();
  await app.ready();
  const spec = app.swagger();
  const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../openapi");
  writeFileSync(path.join(outDir, "openapi.json"), JSON.stringify(spec, null, 2) + "\n");
  console.log(`Wrote ${path.join(outDir, "openapi.json")}`);
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
