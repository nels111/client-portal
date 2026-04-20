import { requireSuperAdmin } from "@/lib/session-guard";
import { prisma } from "@/lib/prisma";
import { formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

function cellChip(cell: string | null | undefined) {
  const base =
    "inline-flex items-center px-2 py-[2px] rounded-[6px] text-[10.5px] font-medium tracking-[0.04em] border";
  if (cell === "C") return `${base} bg-[#eaf3eb] text-[#1f4721] border-[#cde0d0]`;
  if (cell === "B") return `${base} bg-[#eef2f7] text-[#294867] border-[#d5dfeb]`;
  if (cell === "A") return `${base} bg-[#f3eef7] text-[#5a3a74] border-[#dfd0ea]`;
  return `${base} bg-surface-muted text-text-muted border-border`;
}

export default async function AdminPage() {
  const session = await requireSuperAdmin();

  const clients = await prisma.clients.findMany({
    include: {
      organisations: true,
      _count: {
        select: { documents: true, audit_scores: true, client_users: true }
      }
    },
    orderBy: [{ is_active: "desc" }, { name: "asc" }]
  });

  const impersonatingId = session.impersonating_client_id ?? null;

  const totals = {
    clients: clients.length,
    active: clients.filter((c) => c.is_active).length,
    documents: clients.reduce((s, c) => s + c._count.documents, 0),
    audits: clients.reduce((s, c) => s + c._count.audit_scores, 0)
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="label-xs">Super Admin</span>
          <h1 className="mt-3 text-[26px] md:text-[30px] font-semibold tracking-[-0.015em]">
            All clients
          </h1>
          <p className="text-[13.5px] text-text-muted mt-1">
            Signed in as {session.name ?? session.email}. Impersonate any client to preview their
            portal exactly as they see it.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Clients" value={totals.clients.toString()} sub="On the platform" />
        <MetricCard label="Active" value={totals.active.toString()} sub="Currently live" />
        <MetricCard label="Documents" value={totals.documents.toString()} sub="Synced from Dropbox" />
        <MetricCard label="Audits" value={totals.audits.toString()} sub="On record" />
      </section>

      {impersonatingId && (
        <section className="card border-[#f3d57a] bg-[#fdf7e2]/40">
          <div className="flex items-center justify-between gap-4">
            <div className="text-[13px] text-[#6b5200]">
              <span className="font-semibold">Impersonation active.</span> Close impersonation to
              return to this admin view at any time.
            </div>
            <form action="/api/admin/stop-impersonating" method="POST">
              <button type="submit" className="btn btn-ghost text-[12px]">
                Stop impersonating
              </button>
            </form>
          </div>
        </section>
      )}

      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="label-xs">Client directory</span>
            <h2 className="mt-2 text-[16px] font-semibold tracking-[-0.005em]">
              {clients.length} client{clients.length === 1 ? "" : "s"}
            </h2>
          </div>
        </div>

        {clients.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-text-soft">
            No clients yet. Run the seed script or provision clients through the database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-text-soft border-b border-border">
                  <th className="py-2 pr-4 font-medium">Client</th>
                  <th className="py-2 pr-4 font-medium">Organisation</th>
                  <th className="py-2 pr-4 font-medium">Cell</th>
                  <th className="py-2 pr-4 font-medium">Docs</th>
                  <th className="py-2 pr-4 font-medium">Audits</th>
                  <th className="py-2 pr-4 font-medium">Users</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Added</th>
                  <th className="py-2 pl-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((c) => {
                  const isCurrent = impersonatingId === c.id;
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-surface-muted/60 transition-colors ${
                        isCurrent ? "bg-accent-soft/30" : ""
                      }`}
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium">{c.name}</div>
                        {c.contract_ref && (
                          <div className="text-[11px] font-mono text-text-soft uppercase tracking-[0.1em]">
                            {c.contract_ref}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-text-muted">{c.organisations.name}</td>
                      <td className="py-3 pr-4">
                        {c.cell_type ? (
                          <span className={cellChip(c.cell_type)}>Cell {c.cell_type}</span>
                        ) : (
                          <span className="text-text-soft">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-mono text-[12px]">{c._count.documents}</td>
                      <td className="py-3 pr-4 font-mono text-[12px]">{c._count.audit_scores}</td>
                      <td className="py-3 pr-4 font-mono text-[12px]">{c._count.client_users}</td>
                      <td className="py-3 pr-4">
                        {c.is_active ? (
                          <span className="chip chip-good">Active</span>
                        ) : (
                          <span className="chip chip-bad">Paused</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-text-muted text-[12px]">
                        {formatRelative(c.created_at)}
                      </td>
                      <td className="py-3 pl-4 text-right">
                        {isCurrent ? (
                          <span className="text-[11px] font-mono text-text-soft uppercase tracking-[0.08em]">
                            Viewing
                          </span>
                        ) : (
                          <form action="/api/admin/impersonate" method="POST" className="inline">
                            <input type="hidden" name="client_id" value={c.id} />
                            <button type="submit" className="btn btn-ghost text-[12px]">
                              View as client
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <span className="label-xs">Operational notes</span>
        <h2 className="mt-2 text-[15px] font-semibold tracking-[-0.005em]">How this view works</h2>
        <ul className="mt-4 space-y-2 text-[13px] text-text-muted list-disc pl-5">
          <li>
            Impersonation switches the entire portal (dashboard, documents, audits, activity) to
            show exactly what that client sees.
          </li>
          <li>
            A yellow banner will appear at the top of the portal while impersonation is active.
            Close it to return here.
          </li>
          <li>
            Client counts update in real time from Dropbox sync, audit submissions, and activity
            logging.
          </li>
          <li>
            New clients are provisioned through the database: add a row in{" "}
            <code className="font-mono text-[11px] bg-surface-muted px-1 py-[1px] rounded">
              clients
            </code>
            , then a matching{" "}
            <code className="font-mono text-[11px] bg-surface-muted px-1 py-[1px] rounded">
              client_users
            </code>{" "}
            row so the contact can sign in.
          </li>
        </ul>
      </section>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <span className="label-xs">{label}</span>
      <div className="mt-3 text-[28px] font-semibold tracking-[-0.02em] leading-none">{value}</div>
      {sub && <div className="mt-2 text-[11.5px] text-text-soft">{sub}</div>}
    </div>
  );
}
