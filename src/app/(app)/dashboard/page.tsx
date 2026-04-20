import Link from "next/link";
import { requireSession, requireActiveClient } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatRelative, categoryChip } from "@/lib/format";
import AuditTrendChart from "@/components/AuditTrendChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();
  const client = await requireActiveClient(session);

  const [docsCount, auditCount, latestAudit, recentDocs, recentActivity, auditHistory] =
    await Promise.all([
      prisma.documents.count({ where: { client_id: client.id } }),
      prisma.audit_scores.count({ where: { client_id: client.id } }),
      prisma.audit_scores.findFirst({
        where: { client_id: client.id },
        orderBy: { audit_date: "desc" }
      }),
      prisma.documents.findMany({
        where: { client_id: client.id },
        orderBy: { synced_at: "desc" },
        take: 5
      }),
      prisma.activity_log.findMany({
        where: { client_id: client.id },
        orderBy: { created_at: "desc" },
        take: 5
      }),
      prisma.audit_scores.findMany({
        where: { client_id: client.id },
        orderBy: { audit_date: "desc" },
        take: 12
      })
    ]);

  const avgScore =
    auditHistory.length > 0
      ? Math.round(auditHistory.reduce((s, a) => s + a.score, 0) / auditHistory.length)
      : null;

  const previousAudit = auditHistory[1];
  const trend =
    latestAudit && previousAudit ? latestAudit.score - previousAudit.score : null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="label-xs">Overview</span>
          <h1 className="mt-3 text-[26px] md:text-[30px] font-semibold tracking-[-0.015em]">
            {client.name}
          </h1>
          <p className="text-[13.5px] text-text-muted mt-1">
            {client.cell_type ? `Cell ${client.cell_type} contract` : "Contract"}
            {client.contract_ref ? ` · ${client.contract_ref}` : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/documents" className="btn btn-ghost">
            View documents
          </Link>
          <Link href="/audits" className="btn btn-primary">
            <span>View all audits</span>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Documents"
          value={docsCount.toString()}
          sub="Site pack, policies, insurance"
        />
        <StatCard
          label="Latest audit"
          value={latestAudit ? `${latestAudit.score}` : "—"}
          sub={
            latestAudit
              ? `${formatRelative(latestAudit.audit_date)} · ${latestAudit.auditor ?? "Auditor"}`
              : "No audits yet"
          }
          chip={latestAudit ? scoreChip(latestAudit.score) : undefined}
          trend={trend}
        />
        <StatCard
          label="Average score"
          value={avgScore ? `${avgScore}` : "—"}
          sub={auditCount > 0 ? `Across ${auditCount} audit${auditCount === 1 ? "" : "s"}` : "—"}
        />
        <StatCard
          label="Audits on file"
          value={auditCount.toString()}
          sub={
            client.cell_type === "C"
              ? "Cell C: weekly audit cadence"
              : client.cell_type === "B"
              ? "Cell B: fortnightly audits"
              : client.cell_type === "A"
              ? "Cell A: monthly audits"
              : "Audit records"
          }
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="label-xs">Recent documents</span>
              <h2 className="mt-2 text-[16px] font-semibold tracking-[-0.005em]">
                Latest files synced
              </h2>
            </div>
            <Link href="/documents" className="text-[12.5px] text-accent-dark font-medium hover:underline">
              View all →
            </Link>
          </div>
          {recentDocs.length === 0 ? (
            <EmptyState text="No documents synced yet." />
          ) : (
            <ul className="divide-y divide-border">
              {recentDocs.map((d) => (
                <li key={d.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13.5px] font-medium truncate">{d.file_name}</span>
                      {d.category && (
                        <span className={categoryChip(d.category)}>{d.category}</span>
                      )}
                    </div>
                    <span className="text-[11.5px] text-text-soft">
                      {d.folder ?? "—"} · {formatRelative(d.synced_at)}
                    </span>
                  </div>
                  <Link
                    href={`/documents/${d.id}/view`}
                    className="btn btn-ghost text-[12px] flex-shrink-0"
                    prefetch={false}
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="label-xs">Recent activity</span>
              <h2 className="mt-2 text-[16px] font-semibold tracking-[-0.005em]">Timeline</h2>
            </div>
            <Link href="/activity" className="text-[12.5px] text-accent-dark font-medium hover:underline">
              View all →
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <EmptyState text="No activity yet." />
          ) : (
            <ol className="space-y-3">
              {recentActivity.map((a) => (
                <li key={a.id} className="relative pl-5">
                  <span
                    className="absolute left-0 top-[7px] w-[7px] h-[7px] rounded-full bg-accent"
                    aria-hidden
                  />
                  <div className="text-[13px] font-medium capitalize">
                    {a.action.replace(/_/g, " ")}
                  </div>
                  {a.description && (
                    <div className="text-[12px] text-text-muted leading-snug">
                      {a.description}
                    </div>
                  )}
                  <div className="text-[11px] text-text-soft font-mono mt-1">
                    {formatDateTime(a.created_at)}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {auditHistory.length > 0 && (
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="label-xs">Audit trend</span>
              <h2 className="mt-2 text-[16px] font-semibold tracking-[-0.005em]">
                Last {auditHistory.length} audit{auditHistory.length === 1 ? "" : "s"}
              </h2>
            </div>
          </div>
          <AuditTrendChart
            points={[...auditHistory]
              .reverse()
              .map((a) => ({ date: a.audit_date.toISOString(), score: a.score }))}
            height={260}
          />
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  chip,
  trend
}: {
  label: string;
  value: string;
  sub?: string;
  chip?: React.ReactNode;
  trend?: number | null;
}) {
  return (
    <div className="card">
      <span className="label-xs">{label}</span>
      <div className="mt-3 flex items-baseline gap-3 flex-wrap">
        <span className="text-[28px] font-semibold tracking-[-0.02em] leading-none">{value}</span>
        {chip}
        {trend !== null && trend !== undefined && trend !== 0 && (
          <span
            className={`text-[12px] font-medium ${
              trend > 0 ? "text-accent-dark" : "text-danger"
            }`}
          >
            {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}
          </span>
        )}
      </div>
      {sub && <div className="mt-2 text-[11.5px] text-text-soft">{sub}</div>}
    </div>
  );
}

function scoreChip(score: number) {
  if (score >= 80) return <span className="chip chip-good">Healthy</span>;
  if (score >= 70) return <span className="chip chip-warn">Action plan</span>;
  return <span className="chip chip-bad">Intervention</span>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-10 text-center text-[12.5px] text-text-soft border border-dashed border-border rounded-[12px]">
      {text}
    </div>
  );
}

