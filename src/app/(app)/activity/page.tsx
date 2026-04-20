import { requireSession, requireActiveClient } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatDate, titleCase } from "@/lib/format";

export const dynamic = "force-dynamic";

function groupByDay(rows: { created_at: Date; id: string }[]) {
  const map = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries());
}

export default async function ActivityPage() {
  const session = await requireSession();
  const client = await requireActiveClient(session);

  const activity = await prisma.activity_log.findMany({
    where: { client_id: client.id },
    orderBy: { created_at: "desc" },
    take: 250
  });

  const grouped = groupByDay(activity);

  return (
    <div className="space-y-8">
      <header>
        <span className="label-xs">Log</span>
        <h1 className="mt-3 text-[26px] md:text-[30px] font-semibold tracking-[-0.015em]">
          Activity
        </h1>
        <p className="text-[13.5px] text-text-muted mt-1">
          {activity.length} event{activity.length === 1 ? "" : "s"} recorded for {client.name}
        </p>
      </header>

      {activity.length === 0 ? (
        <div className="card">
          <div className="py-12 text-center text-[13px] text-text-soft">
            No activity yet. Updates appear here when documents sync, audits are filed, or your
            contract details change.
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([day, rows]) => (
            <section key={day} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="label-xs">Date</span>
                  <h2 className="mt-2 text-[15px] font-semibold tracking-[-0.005em]">
                    {formatDate(day)}
                  </h2>
                </div>
                <span className="text-[11.5px] font-mono text-text-soft">
                  {rows.length} event{rows.length === 1 ? "" : "s"}
                </span>
              </div>
              <ol className="space-y-4">
                {(rows as typeof activity).map((a) => (
                  <li key={a.id} className="relative pl-5">
                    <span
                      className="absolute left-0 top-[7px] w-[7px] h-[7px] rounded-full bg-accent"
                      aria-hidden
                    />
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-[13.5px] font-medium">
                        {titleCase(a.action.replace(/_/g, " "))}
                      </div>
                      <div className="text-[11px] text-text-soft font-mono">
                        {formatDateTime(a.created_at)}
                      </div>
                    </div>
                    {a.description && (
                      <div className="text-[12.5px] text-text-muted leading-snug mt-1">
                        {a.description}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
