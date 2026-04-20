import { requireSession, requireActiveClient } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRelative } from "@/lib/format";
import AuditTrendChart from "@/components/AuditTrendChart";
import AuditNotesCell from "@/components/AuditNotesCell";

export const dynamic = "force-dynamic";

function band(score: number) {
  if (score >= 80) return { label: "Healthy", cls: "chip chip-good" };
  if (score >= 70) return { label: "Action plan", cls: "chip chip-warn" };
  return { label: "Intervention", cls: "chip chip-bad" };
}

export default async function AuditsPage() {
  const session = await requireSession();
  const client = await requireActiveClient(session);

  const audits = await prisma.audit_scores.findMany({
    where: { client_id: client.id },
    orderBy: { audit_date: "desc" }
  });

  const latest = audits[0];
  const previous = audits[1];
  const trend = latest && previous ? latest.score - previous.score : null;
  const average =
    audits.length > 0
      ? Math.round(audits.reduce((s, a) => s + a.score, 0) / audits.length)
      : null;
  const highest = audits.length > 0 ? Math.max(...audits.map((a) => a.score)) : null;
  const lowest = audits.length > 0 ? Math.min(...audits.map((a) => a.score)) : null;

  const cadence =
    client.cell_type === "C"
      ? "Weekly"
      : client.cell_type === "B"
      ? "Fortnightly"
      : client.cell_type === "A"
      ? "Monthly"
      : "Scheduled";

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="label-xs">Quality</span>
          <h1 className="mt-3 text-[26px] md:text-[30px] font-semibold tracking-[-0.015em]">
            Audit history
          </h1>
          <p className="text-[13.5px] text-text-muted mt-1">
            {cadence} audit cadence · {audits.length} record{audits.length === 1 ? "" : "s"} on file
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          label="Latest"
          value={latest ? latest.score.toString() : "—"}
          sub={latest ? `${formatRelative(latest.audit_date)} · ${latest.auditor ?? "Auditor"}` : "No audits yet"}
          chip={latest ? band(latest.score).cls : undefined}
          chipLabel={latest ? band(latest.score).label : undefined}
          trend={trend}
        />
        <ScoreCard
          label="Average"
          value={average !== null ? average.toString() : "—"}
          sub={audits.length > 0 ? `Across ${audits.length} audit${audits.length === 1 ? "" : "s"}` : "—"}
        />
        <ScoreCard
          label="Highest"
          value={highest !== null ? highest.toString() : "—"}
          sub="Best recorded score"
        />
        <ScoreCard
          label="Lowest"
          value={lowest !== null ? lowest.toString() : "—"}
          sub="Intervention benchmark"
        />
      </section>

      {audits.length === 0 ? (
        <div className="card">
          <div className="py-12 text-center text-[13px] text-text-soft">
            No audits recorded yet. Your first audit will appear here after completion.
          </div>
        </div>
      ) : (
        <>
          <section className="card">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <span className="label-xs">Trend</span>
                <h2 className="mt-2 text-[16px] font-semibold tracking-[-0.005em]">
                  Score history
                </h2>
                <p className="text-[12px] text-text-muted mt-1">
                  Thresholds at 80 (healthy) and 70 (action plan). Cell {client.cell_type ?? "—"} · {cadence.toLowerCase()} cadence.
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-text-soft">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-band-healthy" /> Healthy 80+
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-band-action" /> Action 70-79
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-band-intervene" /> Intervene &lt;70
                </span>
              </div>
            </div>
            <AuditTrendChart
              points={[...audits]
                .reverse()
                .map((a) => ({ date: a.audit_date.toISOString(), score: a.score }))}
              height={300}
            />
          </section>

        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="label-xs">Record</span>
              <h2 className="mt-2 text-[16px] font-semibold tracking-[-0.005em]">All audits</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-text-soft border-b border-border">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Score</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Auditor</th>
                  <th className="py-2 pr-4 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {audits.map((a) => {
                  const b = band(a.score);
                  return (
                    <tr key={a.id} className="hover:bg-surface-muted/60 transition-colors">
                      <td className="py-3 pr-4 font-mono text-[12px]">{formatDate(a.audit_date)}</td>
                      <td className="py-3 pr-4 font-semibold">{a.score}</td>
                      <td className="py-3 pr-4">
                        <span className={b.cls}>{b.label}</span>
                      </td>
                      <td className="py-3 pr-4 text-text-muted">{a.auditor ?? "—"}</td>
                      <td className="py-3 pr-4 align-top max-w-[420px]">
                        <AuditNotesCell notes={a.notes} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        </>
      )}
    </div>
  );
}

function ScoreCard({
  label,
  value,
  sub,
  chip,
  chipLabel,
  trend
}: {
  label: string;
  value: string;
  sub?: string;
  chip?: string;
  chipLabel?: string;
  trend?: number | null;
}) {
  return (
    <div className="card">
      <span className="label-xs">{label}</span>
      <div className="mt-3 flex items-baseline gap-3 flex-wrap">
        <span className="text-[28px] font-semibold tracking-[-0.02em] leading-none">{value}</span>
        {chip && chipLabel && <span className={chip}>{chipLabel}</span>}
        {trend !== null && trend !== undefined && trend !== 0 && (
          <span
            className={`text-[12px] font-medium ${trend > 0 ? "text-accent-dark" : "text-danger"}`}
          >
            {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}
          </span>
        )}
      </div>
      {sub && <div className="mt-2 text-[11.5px] text-text-soft">{sub}</div>}
    </div>
  );
}
