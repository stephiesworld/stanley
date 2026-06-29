import { NextRequest, NextResponse } from "next/server";
import { oauthClient, CALENDAR_SCOPES } from "@/lib/google";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

// The SMS→browser handoff. Stanley texts a link containing a single-use token;
// tapping it lands here, we resolve the token to a user, and bounce to Google's
// consent screen with the user id carried in `state` so the callback knows who
// just authorized. Offline access so we get a refresh token.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  const userId = await getStore().takeOAuthHandoff(token);
  if (!userId) {
    return new NextResponse(
      "This link has expired or was already used. Text STANLEY again for a fresh one.",
      { status: 410, headers: { "Content-Type": "text/plain" } },
    );
  }
  try {
    const url = oauthClient().generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: CALENDAR_SCOPES,
      state: userId,
    });
    return NextResponse.redirect(url);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
