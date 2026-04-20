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

  if (session.impersonating_client_id) {
    await prisma.activity_log.create({
      data: {
        id: randomUUID(),
        client_id: session.impersonating_client_id,
        action: "admin_impersonation_stopped",
        description: `${session.name ?? session.email} stopped viewing this portal as a client.`,
        metadata: { admin_email: session.email }
      }
    });
  }

  await setSessionCookie({
    user_id: session.user_id,
    email: session.email,
    name: session.name,
    is_super_admin: true,
    impersonating_client_id: null
  });

  return NextResponse.redirect(`${origin}/admin`, { status: 303 });
}
