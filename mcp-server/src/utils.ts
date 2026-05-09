import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function resolveRepoRoot(): string {
  const candidates = [
    join(__dirname, "..", ".."),
    join(__dirname, ".."),
    process.cwd(),
  ];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "engineering")) && existsSync(join(candidate, "strategy"))) {
      return candidate;
    }
  }
  return join(__dirname, "..", "..");
}
