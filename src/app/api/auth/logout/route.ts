import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle() {
  await clearSessionCookie();
  const base = process.env.PORTAL_BASE_URL ?? "https://portal.signature-cleans.co.uk";
  return NextResponse.redirect(`${base}/login`, { status: 302 });
}

export async function GET() {
  return handle();
}

export async function POST() {
  return handle();
}
