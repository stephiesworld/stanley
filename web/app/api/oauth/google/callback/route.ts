import { NextRequest, NextResponse } from "next/server";
import { oauthClient } from "@/lib/google";
import { getStore } from "@/lib/store";
import { runTurn } from "@/lib/conversation";
import { googleCalendarSource } from "@/lib/calendar-source";
import { notify } from "@/lib/notify";
import { youreSetPage } from "@/lib/pages";

export const runtime = "nodejs";

// Google bounces back here after consent. We exchange the code, store the tokens
// encrypted against the user from `state`, mark them active, and — because the
// whole point is that Stanley texts first — fire off a confirmation plus a first
// short briefing over SMS. Then show the brass-and-ink "you're set" page.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const userId = req.nextUrl.searchParams.get("state");
  if (!code || !userId) {
    return NextResponse.json({ error: "Missing code/state from Google" }, { status: 400 });
  }

  const store = getStore();
  try {
    const { tokens } = await oauthClient().getToken(code);
    await store.setTokens(userId, tokens);
    await store.setUserStatus(userId, "active");

    const user = await store.getUserById(userId);

    // Stanley messages first: confirmation + a first briefing (fire-and-forget
    // so the browser sees "you're set" immediately).
    if (user) {
      void (async () => {
        try {
          await notify(user, "Connected. I can see your week now.");
          const result = await runTurn({
            store,
            user,
            text: "Give me a first short briefing.",
            calendar: googleCalendarSource(store, userId),
            now: new Date(),
          });
          await notify(user, result.reply);
        } catch (e) {
          console.error("first-briefing send failed:", (e as Error).message);
        }
      })();
    }

    return new NextResponse(youreSetPage(), { headers: { "Content-Type": "text/html" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
