import { NextRequest, NextResponse } from "next/server";
import { consumeMagicLinkToken, resolveUserForEmail, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  const token = url.searchParams.get("token");

  const origin = process.env.PORTAL_BASE_URL ?? url.origin;

  if (!email || !token) {
    return NextResponse.redirect(`${origin}/login?err=missing`);
  }

  const ok = await consumeMagicLinkToken(email, token);
  if (!ok) {
    return NextResponse.redirect(`${origin}/login?err=expired`);
  }

  const resolved = await resolveUserForEmail(email);
  if (!resolved) {
    return NextResponse.redirect(`${origin}/login?err=noaccess`);
  }

  await setSessionCookie({
    user_id: resolved.user.id,
    email: resolved.user.email ?? email,
    name: resolved.user.name,
    is_super_admin: resolved.is_super_admin,
    impersonating_client_id: null
  });

  const dest = resolved.is_super_admin ? "/admin" : "/dashboard";
  return NextResponse.redirect(`${origin}${dest}`);
}
