import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createMagicLinkToken, resolveUserForEmail } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email().max(254) });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const base = process.env.PORTAL_BASE_URL ?? "https://portal.signature-cleans.co.uk";

  const resolved = await resolveUserForEmail(email);

  // Generic response regardless of match to prevent email enumeration.
  // Only actually send the email if the address has portal access.
  if (resolved) {
    try {
      const token = await createMagicLinkToken(email);
      const link = `${base}/api/auth/verify?email=${encodeURIComponent(email)}&token=${token}`;
      await sendMagicLinkEmail({
        to: email,
        link,
        name: resolved.user.name
      });
    } catch (err) {
      console.error("[send-link] Failed to send email:", err);
      return NextResponse.json(
        { error: "Could not send the link right now. Try again shortly." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
