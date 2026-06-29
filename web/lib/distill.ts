import Anthropic from "@anthropic-ai/sdk";
import { getStore } from "./store";
import { MemoryProfile } from "./store/types";

// Nightly distillation — Layer 3. Reads the day's append-only episodes and
// folds them into the Quirks Profile (quirks_profile.schema.json): confidence-
// scored, probabilistic beliefs that cite the episodes justifying them.
//
// The one hard rule encoded here, straight from the schema: a *retreat*-polarity
// belief ("she's pulling back from X") must NEVER be auto-confirmed from silent
// observation. The model may surface it at low confidence with
// signature_confirmed:false; only an explicit in-conversation confirmation (not
// this job) may ever set it true.

const MODEL = "claude-haiku-4-5";

const TOOL: Anthropic.Tool = {
  name: "update_profile",
  description:
    "Merge new evidence into the user's quirks profile. Beliefs are probabilistic, not rules. " +
    "approach-polarity beliefs may gain confidence from repetition; retreat-polarity beliefs must keep " +
    "signature_confirmed=false here (only an explicit spoken confirmation can set it true).",
  input_schema: {
    type: "object",
    properties: {
      preferences: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            statement: { type: "string" },
            domain: {
              type: "string",
              enum: ["scheduling", "social", "work", "health", "travel", "rhythm", "other"],
            },
            polarity: { type: "string", enum: ["approach", "retreat"] },
            confidence: { type: "number" },
            signature_confirmed: { type: "boolean" },
            episode_ids: { type: "array", items: { type: "string" } },
          },
          required: ["id", "statement", "confidence", "polarity", "episode_ids"],
        },
      },
    },
    required: ["preferences"],
  },
};

export async function distillUser(userId: string): Promise<MemoryProfile | null> {
  const store = getStore();
  const episodes = await store.recentEpisodes(userId, 50);
  if (episodes.length === 0) return null;

  const prior = await store.getProfile(userId);
  const client = new Anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "update_profile" },
    messages: [
      {
        role: "user",
        content: [
          "Existing profile beliefs (may be empty):",
          JSON.stringify(prior?.preferences ?? [], null, 2),
          "",
          "New episodes (append-only, verbatim user statements):",
          ...episodes.map((e) => `- [${e.id}] ${e.text}`),
          "",
          "Call update_profile with the merged belief set. Cite episode ids. Keep retreat beliefs unconfirmed.",
        ].join("\n"),
      },
    ],
  });

  const block = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "update_profile",
  );
  if (!block) return null;

  const preferences = (block.input as { preferences: unknown[] }).preferences ?? [];
  // safety net: never let the distiller confirm a retreat belief
  for (const p of preferences as Array<Record<string, unknown>>) {
    if (p.polarity === "retreat") p.signature_confirmed = false;
  }

  const profile: MemoryProfile = {
    user_id: userId,
    updated_at: new Date().toISOString(),
    preferences,
    seasons: prior?.seasons ?? [],
    guarded_blocks: prior?.guarded_blocks ?? [],
    labels: prior?.labels ?? {},
  };
  await store.setProfile(profile);
  return profile;
}

export async function distillAll(): Promise<{ updated: number }> {
  const store = getStore();
  const users = await store.listActiveUsers();
  let updated = 0;
  for (const u of users) {
    try {
      const p = await distillUser(u.id);
      if (p) updated += 1;
    } catch (e) {
      console.error(`distill ${u.id} failed:`, (e as Error).message);
    }
  }
  return { updated };
}
