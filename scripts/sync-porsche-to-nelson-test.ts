import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { listFolderRecursive } from "../src/lib/dropbox";

const prisma = new PrismaClient();

const CLIENT_ID = "client_nelson_test";
const ORG_ID = "org_signature_cleans";
const PORSCHE_ROOT =
  "/Signature Cleans (1)/Signature Cleans - Exeter & Newton Abbot/Contract Cleaning Clients/Porsche";

function inferCategory(relativePath: string): string | null {
  const p = relativePath.toLowerCase();
  if (p.includes("/audits/") || p.startsWith("audits/")) return "audit";
  if (p.includes("operative checklists") || p.includes("site pack")) return "site_pack";
  if (p.includes("contract") || p.includes("site details") || p.includes("specs"))
    return "contract";
  if (p.includes("insurance")) return "insurance";
  if (p.includes("polic")) return "policy";
  if (p.includes("induction") || p.includes("training")) return "training";
  if (p.includes("photo") || p.includes("image")) return "photo";
  return null;
}

function fileExt(name: string): string | null {
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : null;
}

function topFolder(relativePath: string): string {
  const parts = relativePath.split("/").filter(Boolean);
  if (parts.length <= 1) return "Root";
  return parts[0];
}

async function main() {
  console.log(`[sync] Verifying client ${CLIENT_ID}...`);
  const client = await prisma.clients.findUnique({ where: { id: CLIENT_ID } });
  if (!client) throw new Error(`Client ${CLIENT_ID} not found in DB`);
  console.log(`[sync] Client found: ${client.name}`);

  console.log(`[sync] Listing Dropbox recursively: ${PORSCHE_ROOT}`);
  const files = await listFolderRecursive(PORSCHE_ROOT);
  console.log(`[sync] Found ${files.length} files in Dropbox`);

  if (files.length === 0) {
    console.log("[sync] No files found. Aborting (nothing to sync).");
    return;
  }

  console.log(`[sync] Deleting existing documents for ${CLIENT_ID}...`);
  const deleted = await prisma.documents.deleteMany({ where: { client_id: CLIENT_ID } });
  console.log(`[sync] Deleted ${deleted.count} existing documents`);

  console.log(`[sync] Clearing existing activity_log for ${CLIENT_ID}...`);
  await prisma.activity_log.deleteMany({ where: { client_id: CLIENT_ID } });

  let inserted = 0;
  let skipped = 0;
  const now = new Date();

  for (const f of files) {
    const rel = f.path_display.startsWith(PORSCHE_ROOT)
      ? f.path_display.slice(PORSCHE_ROOT.length).replace(/^\/+/, "")
      : f.path_display;

    const folder = topFolder(rel);
    const category = inferCategory(rel);
    const ext = fileExt(f.name);

    try {
      await prisma.documents.create({
        data: {
          id: randomUUID(),
          client_id: CLIENT_ID,
          org_id: ORG_ID,
          dropbox_path: f.path_display,
          // Null here on purpose: real Porsche client already owns these
          // dropbox_ids from the 15 Apr v1 sync. Nelson Test is a UAT copy
          // pointing at the same physical files — null avoids the unique
          // constraint collision. File identity in this table is (client_id, dropbox_path).
          dropbox_id: null,
          file_name: f.name,
          file_type: ext,
          file_size: f.size ?? null,
          category,
          folder,
          last_modified: f.client_modified ? new Date(f.client_modified) : null,
          synced_at: now,
          created_at: now
        }
      });
      inserted++;
    } catch (err: any) {
      if (err?.code === "P2002") {
        skipped++;
        continue;
      }
      console.error(`[sync] Error inserting ${f.path_display}:`, err?.message ?? err);
      skipped++;
    }
  }

  await prisma.activity_log.create({
    data: {
      id: randomUUID(),
      client_id: CLIENT_ID,
      action: "documents_synced",
      description: `Synced ${inserted} documents from Porsche Dropbox folder.`,
      metadata: {
        source_path: PORSCHE_ROOT,
        inserted,
        skipped,
        total_found: files.length
      }
    }
  });

  console.log("");
  console.log("===== SYNC SUMMARY =====");
  console.log(`Total Dropbox files : ${files.length}`);
  console.log(`Inserted            : ${inserted}`);
  console.log(`Skipped             : ${skipped}`);
  console.log("========================");

  const byFolder = await prisma.documents.groupBy({
    by: ["folder"],
    where: { client_id: CLIENT_ID },
    _count: true
  });
  console.log("");
  console.log("Files by folder:");
  for (const b of byFolder) {
    console.log(`  ${b.folder ?? "(none)"}: ${b._count}`);
  }

  const byCategory = await prisma.documents.groupBy({
    by: ["category"],
    where: { client_id: CLIENT_ID },
    _count: true
  });
  console.log("");
  console.log("Files by category:");
  for (const b of byCategory) {
    console.log(`  ${b.category ?? "(none)"}: ${b._count}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
