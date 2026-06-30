// Copies the canonical soul file (repo root, single-writer: Fable) and the
// v1 profile into web/prompts/ so dev is self-contained. The copies in
// web/prompts/ are COMMITTED so cloud builds (which only upload web/) ship the
// soul too. When the repo-root sources aren't present — i.e. a Vercel build —
// this skips gracefully and the committed copies are used as-is.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(here, "..");
const repoRoot = path.join(webRoot, "..");
const promptsDir = path.join(webRoot, "prompts");

mkdirSync(promptsDir, { recursive: true });

const pairs = [
  [path.join(repoRoot, "system_prompt.md"), path.join(promptsDir, "system_prompt.md")],
  [path.join(repoRoot, "harness", "profile.md"), path.join(promptsDir, "profile.md")],
];

let copied = 0;
for (const [src, dst] of pairs) {
  if (existsSync(src)) {
    copyFileSync(src, dst);
    copied += 1;
  }
}

console.log(
  copied
    ? `synced ${copied} file(s) into web/prompts/`
    : "sync-prompt: repo-root sources not found (cloud build) — using committed web/prompts/",
);
