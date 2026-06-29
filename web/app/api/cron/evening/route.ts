import { NextRequest, NextResponse } from "next/server";
import { cronAuthorized, broadcast } from "@/lib/cron";

export const runtime = "nodejs";

// Evening check-in — scheduled in vercel.json.
export async function GET(req: NextRequest) {
  if (!cronAuthorized(req)) return new NextResponse("unauthorized", { status: 401 });
  const result = await broadcast("Evening check-in.");
  return NextResponse.json({ ok: true, ...result });
}
