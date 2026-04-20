import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireSession, resolveActiveClient } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { getTemporaryLink } from "@/lib/dropbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const origin = process.env.PORTAL_BASE_URL ?? url.origin;
  const forceDownload = url.searchParams.get("force") === "1";

  const session = await requireSession();
  const client = await resolveActiveClient(session);

  if (!client) {
    return NextResponse.redirect(`${origin}/no-access`, { status: 303 });
  }

  const doc = await prisma.documents.findUnique({ where: { id } });
  if (!doc || doc.client_id !== client.id) {
    return NextResponse.redirect(`${origin}/documents?err=not_found`, { status: 303 });
  }

  try {
    const link = await getTemporaryLink(doc.dropbox_path);

    await prisma.activity_log.create({
      data: {
        id: randomUUID(),
        client_id: client.id,
        action: forceDownload ? "document_downloaded" : "document_opened",
        description: `${session.name ?? session.email} ${forceDownload ? "downloaded" : "opened"} ${doc.file_name}.`,
        metadata: {
          document_id: doc.id,
          file_name: doc.file_name,
          opened_by: session.email,
          mode: forceDownload ? "download" : "inline"
        }
      }
    });

    if (forceDownload) {
      // Stream the file through the portal so we can attach Content-Disposition.
      const fileRes = await fetch(link, { cache: "no-store" });
      if (!fileRes.ok || !fileRes.body) {
        throw new Error(`Dropbox file fetch failed (${fileRes.status})`);
      }
      const headers = new Headers();
      const contentType = fileRes.headers.get("content-type") ?? "application/octet-stream";
      const contentLength = fileRes.headers.get("content-length");
      headers.set("Content-Type", contentType);
      if (contentLength) headers.set("Content-Length", contentLength);
      const safeName = doc.file_name.replace(/"/g, "");
      headers.set(
        "Content-Disposition",
        `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(doc.file_name)}`
      );
      headers.set("Cache-Control", "private, no-store");
      return new NextResponse(fileRes.body, { status: 200, headers });
    }

    return NextResponse.redirect(link, { status: 302 });
  } catch (err) {
    console.error("[documents/download] Dropbox error:", err);
    return NextResponse.redirect(`${origin}/documents?err=download_failed`, { status: 303 });
  }
}
