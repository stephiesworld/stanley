import Anthropic from "@anthropic-ai/sdk";
import { NormalizedEvent } from "./briefing/types";
import { ProposalAction } from "./store/types";
import { PRINCIPAL_TZ } from "./briefing/time";

// Stanley replies in his own validated PROSE voice (the soul file is never
// taught a tool — single-writer rule, and tool-use would change his register).
// This separate Haiku pass reads the CONVERSATION (not just Stanley's last line)
// against the real calendar and, if a concrete change is awaiting a yes, returns
// a structured action mapped to a real event id. It must see the whole exchange
// to resolve references like "it"/"that" — otherwise it guesses the wrong event.
// No write happens here; only the confirmation handler writes, after a yes.

const EXTRACTOR_MODEL = "claude-haiku-4-5";

const TOOL: Anthropic.Tool = {
  name: "record_proposal",
  description:
    "Record whether the conversation has reached a SPECIFIC, executable calendar change now awaiting the user's yes/no. " +
    "Resolve references like 'it', 'that', 'the 3pm thing' using the whole conversation, not just the last line. " +
    "A change is armable only if BOTH the target event and the new time are unambiguous. " +
    "If a specific change is stated (clear target + time, e.g. 'moving X to Friday 6pm') it counts even with a trailing follow-up question. " +
    "Set is_proposal=false (do NOT arm) if: it's only an offer of options or a 'where should I put it?' with no single slot; OR you cannot identify the exact target event with confidence. " +
    "Changing the wrong event is far worse than asking again — when in doubt, do not arm.",
  input_schema: {
    type: "object",
    properties: {
      is_proposal: {
        type: "boolean",
        description: "true only if a specific change is unambiguously awaiting confirmation.",
      },
      type: { type: "string", enum: ["move", "create", "delete"] },
      event_id: {
        type: "string",
        description: "For move/delete: the exact id of the targeted event from the provided list.",
      },
      target_unambiguous: {
        type: "boolean",
        description:
          "For move/delete: true only if the conversation makes the target event unmistakable. If you had to guess between events, set false.",
      },
      title: { type: "string", description: "For create: the new event's title." },
      new_start: {
        type: "string",
        description: "ISO 8601 with offset, e.g. 2026-06-12T16:00:00-04:00. For move/create.",
      },
      new_end: { type: "string", description: "ISO 8601 with offset. For move/create." },
      location: { type: "string" },
      attendees: {
        type: "array",
        items: { type: "string" },
        description: "For create: email addresses the user asked to invite to the event, if any.",
      },
    },
    required: ["is_proposal"],
  },
};

function candidateList(events: NormalizedEvent[]): string {
  return events
    .filter((e) => !e.isTransit)
    .map((e) => `- id=${e.id} | ${e.title} | ${e.start} → ${e.end}${e.allDay ? " (all-day)" : ""}`)
    .join("\n");
}

function transcript(
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  stanleyReply: string,
): string {
  const lines = history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Stanley"}: ${m.content}`);
  lines.push(`User: ${userMessage}`);
  lines.push(`Stanley (reply to evaluate): ${stanleyReply}`);
  return lines.join("\n");
}

export async function extractProposal(opts: {
  userMessage: string;
  stanleyReply: string;
  history: { role: "user" | "assistant"; content: string }[];
  candidateEvents: NormalizedEvent[];
  now: Date;
}): Promise<ProposalAction | null> {
  const { userMessage, stanleyReply, history, candidateEvents, now } = opts;
  const client = new Anthropic();
  const res = await client.messages.create({
    model: EXTRACTOR_MODEL,
    max_tokens: 400,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "record_proposal" },
    messages: [
      {
        role: "user",
        content: [
          `Current time: ${now.toISOString()} (principal timezone ${PRINCIPAL_TZ}).`,
          "",
          "Calendar events Stanley can see (use these exact ids for move/delete):",
          candidateList(candidateEvents) || "(none)",
          "",
          "Conversation (most recent last):",
          transcript(history, userMessage, stanleyReply),
          "",
          "Call record_proposal for the change (if any) now awaiting the user's yes. Resolve 'it'/'that'/etc. from the conversation. Resolve relative times like 'tomorrow 9am' to ISO using the current time and timezone above. If you cannot pin the exact target event, set is_proposal=false.",
        ].join("\n"),
      },
    ],
  });

  const block = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "record_proposal",
  );
  if (!block) return null;
  const input = block.input as Record<string, unknown>;
  if (!input.is_proposal) return null;

  const type = input.type as ProposalAction["type"] | undefined;
  if (!type) return null;

  // move/delete must target a real event AND be unambiguous — else fail safe.
  if (type === "move" || type === "delete") {
    if (!input.event_id) return null;
    if (!candidateEvents.some((e) => e.id === input.event_id)) return null;
    if (input.target_unambiguous === false) return null; // would have been a guess
  }
  if ((type === "move" || type === "create") && (!input.new_start || !input.new_end)) return null;

  const attendees = Array.isArray(input.attendees)
    ? (input.attendees as unknown[]).filter((a): a is string => typeof a === "string")
    : undefined;

  return {
    type,
    event_id: input.event_id as string | undefined,
    title: input.title as string | undefined,
    new_start: input.new_start as string | undefined,
    new_end: input.new_end as string | undefined,
    location: input.location as string | undefined,
    attendees: attendees && attendees.length ? attendees : undefined,
  };
}
