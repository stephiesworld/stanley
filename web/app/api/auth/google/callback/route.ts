import { NextRequest, NextResponse } from "next/server";
import { oauthClient } from "@/lib/google";

// Dev-only token storage: httpOnly cookie. Production storage moves to
// Supabase when Eluna's auth plumbing is cherry-picked in.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing ?code from Google" }, { status: 400 });
  }
  try {
    const { tokens } = await oauthClient().getToken(code);
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.set("g_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
