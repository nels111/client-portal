import Link from "next/link";
import { notFound } from "next/navigation";
import { randomUUID } from "crypto";
import { requireSession, requireActiveClient } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { getTemporaryLink } from "@/lib/dropbox";
import { formatDateTime, formatFileSize, categoryChip } from "@/lib/format";

export const dynamic = "force-dynamic";

function detectKind(name: string, type: string | null | undefined): "pdf" | "image" | "other" {
  const n = name.toLowerCase();
  const t = (type ?? "").toLowerCase();
  if (n.endsWith(".pdf") || t.includes("pdf")) return "pdf";
  if (/\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name) || t.startsWith("image/")) return "image";
  return "other";
}

export default async function DocumentViewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const client = await requireActiveClient(session);

  const doc = await prisma.documents.findUnique({ where: { id } });
  if (!doc || doc.client_id !== client.id) notFound();

  const kind = detectKind(doc.file_name, doc.file_type);

  let link: string | null = null;
  let linkError: string | null = null;
  try {
    link = await getTemporaryLink(doc.dropbox_path);
    await prisma.activity_log.create({
      data: {
        id: randomUUID(),
        client_id: client.id,
        action: "document_viewed",
        description: `${session.name ?? session.email} viewed ${doc.file_name}.`,
        metadata: {
          document_id: doc.id,
          file_name: doc.file_name,
          viewed_by: session.email,
          mode: "inline"
        }
      }
    });
  } catch (err) {
    console.error("[documents/view] Dropbox error:", err);
    linkError = "Could not load preview. Try downloading the file instead.";
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[12.5px] text-text-soft">
        <Link href="/documents" className="hover:text-text-muted transition-colors">
          Documents
        </Link>
        <span aria-hidden>/</span>
        {doc.folder && (
          <>
            <span className="truncate max-w-[220px]">{doc.folder}</span>
            <span aria-hidden>/</span>
          </>
        )}
        <span className="text-text-muted truncate" aria-current="page">{doc.file_name}</span>
      </nav>

      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <span className="label-xs">File</span>
          <h1 className="mt-3 text-[22px] md:text-[26px] font-semibold tracking-[-0.015em] truncate">
            {doc.file_name}
          </h1>
          <div className="mt-2 flex items-center gap-3 flex-wrap text-[12.5px] text-text-muted">
            {doc.category && <span className={categoryChip(doc.category)}>{doc.category}</span>}
            <span>{formatFileSize(doc.file_size)}</span>
            {doc.last_modified && (
              <span>
                Updated {formatDateTime(doc.last_modified)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/documents" className="btn btn-ghost">
            Back to library
          </Link>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              Open in new tab
            </a>
          )}
          <Link
            href={`/api/documents/${doc.id}/download?force=1`}
            className="btn btn-primary"
            prefetch={false}
          >
            Download
          </Link>
        </div>
      </header>

      <section className="card p-0 overflow-hidden">
        {linkError ? (
          <div className="p-10 text-center text-[13px] text-danger">{linkError}</div>
        ) : !link ? (
          <div className="p-10 text-center text-[13px] text-text-soft">Loading preview…</div>
        ) : kind === "pdf" ? (
          <div className="relative bg-surface-muted" style={{ height: "calc(100vh - 320px)", minHeight: 520 }}>
            <iframe
              src={link}
              title={doc.file_name}
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        ) : kind === "image" ? (
          <div className="flex items-center justify-center bg-surface-muted p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={link}
              alt={doc.file_name}
              className="max-w-full max-h-[70vh] object-contain rounded-[8px] shadow-sm"
            />
          </div>
        ) : (
          <div className="p-10 text-center space-y-3">
            <div className="text-[14px] font-medium">Preview not available</div>
            <div className="text-[12.5px] text-text-muted max-w-md mx-auto">
              This file type can&apos;t be previewed in the browser. Download the file to open it
              with the right application.
            </div>
            <div className="pt-2">
              <Link
                href={`/api/documents/${doc.id}/download?force=1`}
                className="btn btn-primary"
                prefetch={false}
              >
                Download {doc.file_name}
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
