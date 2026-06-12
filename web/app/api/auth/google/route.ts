import { NextResponse } from "next/server";
import { oauthClient, SCOPES } from "@/lib/google";

export async function GET() {
  try {
    const url = oauthClient().generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
    });
    return NextResponse.redirect(url);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
