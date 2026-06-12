// Copies the canonical soul file (repo root, single-writer: Fable) and the
// v1 profile into web/prompts/ so dev and deploys are self-contained.
import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(here, "..");
const repoRoot = path.join(webRoot, "..");
const promptsDir = path.join(webRoot, "prompts");

mkdirSync(promptsDir, { recursive: true });
copyFileSync(path.join(repoRoot, "system_prompt.md"), path.join(promptsDir, "system_prompt.md"));
copyFileSync(path.join(repoRoot, "harness", "profile.md"), path.join(promptsDir, "profile.md"));
console.log("synced soul + profile into web/prompts/");
