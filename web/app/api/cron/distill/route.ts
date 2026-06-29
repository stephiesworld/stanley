import { NextRequest, NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron";
import { distillAll } from "@/lib/distill";

export const runtime = "nodejs";

// Nightly distillation — folds the day's episodes into each user's quirks profile.
export async function GET(req: NextRequest) {
  if (!cronAuthorized(req)) return new NextResponse("unauthorized", { status: 401 });
  const result = await distillAll();
  return NextResponse.json({ ok: true, ...result });
}
