// Seed script for the Signature Cleans Client Portal.
// Creates:
//   - Signature Cleans organisation
//   - Super admins: Nelson + Nick (ONLY these two, no other staff)
//   - Demo client "Nelson Test" linked to nelson@signature-cleans.co.uk + nelsoniseguan@gmail.com
//   - Sample audit scores, documents and activity log for the demo client
//
// Idempotent: re-running will upsert existing rows on stable IDs / unique emails.

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const ORG_ID = "org_signature_cleans";
const CLIENT_ID = "client_nelson_test";

const SUPER_ADMINS: Array<{ id: string; name: string; email: string }> = [
  { id: "sa_nelson", name: "Nelson Iseguan", email: "nelson@signature-cleans.co.uk" },
  { id: "sa_nick", name: "Nick Stentiford", email: "nick@signature-cleans.co.uk" }
];

const CLIENT_USERS: Array<{ id: string; name: string; email: string; role: string }> = [
  { id: "cu_nelson_work", name: "Nelson Iseguan", email: "nelson@signature-cleans.co.uk", role: "admin" },
  { id: "cu_nelson_personal", name: "Nelson Iseguan", email: "nelsoniseguan@gmail.com", role: "admin" }
];

async function main() {
  console.log("Seeding Signature Cleans portal database...");

  // 1. Organisation
  await prisma.organisations.upsert({
    where: { id: ORG_ID },
    update: {
      name: "Signature Cleans",
      slug: "signature-cleans"
    },
    create: {
      id: ORG_ID,
      name: "Signature Cleans",
      slug: "signature-cleans",
      primary_color: "#2c5f2d",
      secondary_color: "#f9a825"
    }
  });
  console.log("  [ok] Organisation");

  // 2. Super admins (Nelson + Nick ONLY)
  for (const admin of SUPER_ADMINS) {
    await prisma.super_admins.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name
      },
      create: {
        id: admin.id,
        name: admin.name,
        email: admin.email
      }
    });
  }
  console.log(`  [ok] Super admins (${SUPER_ADMINS.length})`);

  // 3. Demo client
  await prisma.clients.upsert({
    where: { id: CLIENT_ID },
    update: {
      name: "Nelson Test",
      slug: "nelson-test",
      contract_ref: "TEST-001",
      cell_type: "B",
      contact_name: "Nelson Iseguan",
      contact_email: "nelson@signature-cleans.co.uk",
      dropbox_path: "/Signature Cleans Shared/Clients/Nelson Test",
      is_active: true
    },
    create: {
      id: CLIENT_ID,
      org_id: ORG_ID,
      name: "Nelson Test",
      slug: "nelson-test",
      contract_ref: "TEST-001",
      cell_type: "B",
      contact_name: "Nelson Iseguan",
      contact_email: "nelson@signature-cleans.co.uk",
      dropbox_path: "/Signature Cleans Shared/Clients/Nelson Test",
      is_active: true
    }
  });
  console.log("  [ok] Demo client: Nelson Test");

  // 4. Client users (Nelson's work + personal emails, both linked to Nelson Test)
  for (const user of CLIENT_USERS) {
    await prisma.client_users.upsert({
      where: { id: user.id },
      update: {
        client_id: CLIENT_ID,
        org_id: ORG_ID,
        email: user.email,
        name: user.name,
        role: user.role
      },
      create: {
        id: user.id,
        client_id: CLIENT_ID,
        org_id: ORG_ID,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  }
  console.log(`  [ok] Client users (${CLIENT_USERS.length})`);

  // 5. Reset demo data for the client so re-seeds stay tidy
  await prisma.audit_scores.deleteMany({ where: { client_id: CLIENT_ID } });
  await prisma.documents.deleteMany({ where: { client_id: CLIENT_ID } });
  await prisma.activity_log.deleteMany({ where: { client_id: CLIENT_ID } });

  // 6. Audit scores (4 historic audits showing a trend, oldest first)
  const today = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  };

  const audits = [
    { score: 74, auditor: "Nelson Iseguan", notes: "Initial baseline audit. Common areas good, kitchen needs closer attention.", days: 56 },
    { score: 78, auditor: "Nelson Iseguan", notes: "Improvement on kitchen. Reception windows flagged for next visit.", days: 42 },
    { score: 83, auditor: "Nelson Iseguan", notes: "First clean Healthy-band result. Windows addressed, bins consistent.", days: 28 },
    { score: 87, auditor: "Nelson Iseguan", notes: "Strong performance across all checkpoints. Maintain current SOP.", days: 14 }
  ];

  for (const a of audits) {
    await prisma.audit_scores.create({
      data: {
        id: randomUUID(),
        client_id: CLIENT_ID,
        org_id: ORG_ID,
        score: a.score,
        auditor: a.auditor,
        notes: a.notes,
        audit_date: daysAgo(a.days)
      }
    });
  }
  console.log(`  [ok] Audit scores (${audits.length})`);

  // 7. Documents (sample doc tree the client would see — folder-grouped)
  const documents = [
    {
      file_name: "Signed Service Agreement.pdf",
      folder: "Contract",
      category: "contract",
      file_type: "pdf",
      file_size: 248_512,
      days: 90
    },
    {
      file_name: "Insurance Certificate 2026.pdf",
      folder: "Contract",
      category: "compliance",
      file_type: "pdf",
      file_size: 142_336,
      days: 60
    },
    {
      file_name: "Site Pack - Nelson Test.pdf",
      folder: "Site Pack",
      category: "site_pack",
      file_type: "pdf",
      file_size: 1_284_120,
      days: 56
    },
    {
      file_name: "Risk Assessment.pdf",
      folder: "Site Pack",
      category: "site_pack",
      file_type: "pdf",
      file_size: 312_990,
      days: 56
    },
    {
      file_name: "Method Statement.pdf",
      folder: "Site Pack",
      category: "site_pack",
      file_type: "pdf",
      file_size: 298_110,
      days: 56
    },
    {
      file_name: "Audit - Week 56.pdf",
      folder: "Audits",
      category: "audit",
      file_type: "pdf",
      file_size: 188_400,
      days: 56
    },
    {
      file_name: "Audit - Week 42.pdf",
      folder: "Audits",
      category: "audit",
      file_type: "pdf",
      file_size: 192_800,
      days: 42
    },
    {
      file_name: "Audit - Week 28.pdf",
      folder: "Audits",
      category: "audit",
      file_type: "pdf",
      file_size: 201_350,
      days: 28
    },
    {
      file_name: "Audit - Week 14.pdf",
      folder: "Audits",
      category: "audit",
      file_type: "pdf",
      file_size: 219_780,
      days: 14
    }
  ];

  for (const d of documents) {
    const safe = d.file_name.replace(/\s+/g, "_");
    await prisma.documents.create({
      data: {
        id: randomUUID(),
        client_id: CLIENT_ID,
        org_id: ORG_ID,
        dropbox_path: `/Signature Cleans Shared/Clients/Nelson Test/${d.folder}/${d.file_name}`,
        dropbox_id: `id:seed_${CLIENT_ID}_${safe}`,
        file_name: d.file_name,
        file_type: d.file_type,
        file_size: d.file_size,
        category: d.category,
        folder: d.folder,
        last_modified: daysAgo(d.days)
      }
    });
  }
  console.log(`  [ok] Documents (${documents.length})`);

  // 8. Activity log (recent events the client timeline will render)
  const activity = [
    {
      action: "document_added",
      description: "Audit - Week 14.pdf added to Audits.",
      days: 14,
      metadata: { file_name: "Audit - Week 14.pdf", folder: "Audits" }
    },
    {
      action: "audit_logged",
      description: "Audit completed. Score 87. Strong performance across all checkpoints.",
      days: 14,
      metadata: { score: 87, auditor: "Nelson Iseguan" }
    },
    {
      action: "document_added",
      description: "Audit - Week 28.pdf added to Audits.",
      days: 28,
      metadata: { file_name: "Audit - Week 28.pdf", folder: "Audits" }
    },
    {
      action: "audit_logged",
      description: "Audit completed. Score 83. First Healthy-band result.",
      days: 28,
      metadata: { score: 83, auditor: "Nelson Iseguan" }
    },
    {
      action: "contract_started",
      description: "Contract TEST-001 activated. Cell type B, fortnightly audit cadence.",
      days: 90,
      metadata: { contract_ref: "TEST-001", cell_type: "B" }
    }
  ];

  for (const a of activity) {
    await prisma.activity_log.create({
      data: {
        id: randomUUID(),
        client_id: CLIENT_ID,
        action: a.action,
        description: a.description,
        metadata: a.metadata,
        created_at: daysAgo(a.days)
      }
    });
  }
  console.log(`  [ok] Activity log (${activity.length})`);

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
