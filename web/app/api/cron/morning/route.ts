import { NextRequest, NextResponse } from "next/server";
import { cronAuthorized, broadcast } from "@/lib/cron";

export const runtime = "nodejs";

// Morning briefing — scheduled in vercel.json. (Single cron time for the
// prototype; per-user timezone scheduling is a later refinement.)
export async function GET(req: NextRequest) {
  if (!cronAuthorized(req)) return new NextResponse("unauthorized", { status: 401 });
  const result = await broadcast("Morning briefing.");
  return NextResponse.json({ ok: true, ...result });
}
