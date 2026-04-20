import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  const origin = process.env.PORTAL_BASE_URL ?? new URL(req.url).origin;

  if (!session || !session.is_super_admin) {
    return NextResponse.redirect(`${origin}/login`, { status: 303 });
  }

  const form = await req.formData();
  const clientId = (form.get("client_id") ?? "").toString().trim();

  if (!clientId) {
    return NextResponse.redirect(`${origin}/admin?err=missing_client`, { status: 303 });
  }

  const client = await prisma.clients.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.redirect(`${origin}/admin?err=unknown_client`, { status: 303 });
  }

  await setSessionCookie({
    user_id: session.user_id,
    email: session.email,
    name: session.name,
    is_super_admin: true,
    impersonating_client_id: client.id
  });

  await prisma.activity_log.create({
    data: {
      id: randomUUID(),
      client_id: client.id,
      action: "admin_impersonation_started",
      description: `${session.name ?? session.email} started viewing this portal as a client.`,
      metadata: { admin_email: session.email }
    }
  });

  return NextResponse.redirect(`${origin}/dashboard`, { status: 303 });
}
