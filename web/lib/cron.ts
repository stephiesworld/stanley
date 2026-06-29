import { NextRequest } from "next/server";
import { getStore } from "./store";
import { runTurn } from "./conversation";
import { googleCalendarSource } from "./calendar-source";
import { notify } from "./notify";

// Vercel Cron calls these endpoints with `Authorization: Bearer <CRON_SECRET>`.
// Reject anything that doesn't match so the broadcast endpoints can't be poked
// by outsiders.
export function cronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

// Send the same kind of message (morning briefing / evening check-in) to every
// active user, each against their own live calendar and timezone.
export async function broadcast(prompt: string): Promise<{ sent: number; failed: number }> {
  const store = getStore();
  const users = await store.listActiveUsers();
  let sent = 0;
  let failed = 0;
  for (const user of users) {
    try {
      const tokens = await store.getTokens(user.id);
      if (!tokens) continue; // not connected yet
      const result = await runTurn({
        store,
        user,
        text: prompt,
        calendar: googleCalendarSource(store, user.id),
        now: new Date(),
      });
      await notify(user, result.reply);
      sent += 1;
    } catch (e) {
      console.error(`broadcast to ${user.id} failed:`, (e as Error).message);
      failed += 1;
    }
  }
  return { sent, failed };
}
