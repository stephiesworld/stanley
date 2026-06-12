import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1000;

// The soul file is canonical at the repo root; `npm run sync-prompt`
// (wired into predev/prebuild) copies it here so deploys are self-contained.
// Single-writer rule: this file is edited by Fable only, via Stephie.
function loadSystemPrompt(): string {
  const p = path.join(process.cwd(), "prompts", "system_prompt.md");
  return fs.readFileSync(p, "utf-8").trim();
}

export async function askStanley(
  context: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<string> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: loadSystemPrompt(),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [...history, { role: "user", content: context }],
  });
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}
