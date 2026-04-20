import { requireSession, requireActiveClient } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import DocumentsBrowser, { DocRow } from "@/components/DocumentsBrowser";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const session = await requireSession();
  const client = await requireActiveClient(session);

  const docs = await prisma.documents.findMany({
    where: { client_id: client.id },
    orderBy: [{ folder: "asc" }, { file_name: "asc" }]
  });

  const serialized: DocRow[] = docs.map((d) => ({
    id: d.id,
    file_name: d.file_name,
    file_type: d.file_type,
    file_size: d.file_size,
    category: d.category,
    folder: d.folder,
    last_modified: d.last_modified ? d.last_modified.toISOString() : null,
    synced_at: d.synced_at.toISOString()
  }));

  return <DocumentsBrowser docs={serialized} clientName={client.name} />;
}
