import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { requireSession, resolveActiveClient } from "@/lib/session-guard";
import { redirect } from "next/navigation";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import NavLink from "@/components/NavLink";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  const h = await headers();
  const pathname = h.get("x-pathname") ?? h.get("x-invoke-path") ?? "";
  const onAdmin = pathname.startsWith("/admin");

  const activeClient = await resolveActiveClient(session);

  // Super admin with no impersonation is allowed on /admin without an active client.
  // Everyone else without a client goes to /no-access.
  if (!activeClient && !session.is_super_admin) {
    redirect("/no-access");
  }
  if (!activeClient && session.is_super_admin && !onAdmin) {
    redirect("/admin");
  }

  const initial = (session.name ?? session.email).charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-[8px] focus:bg-white focus:shadow-e2 focus:text-[13px] focus:font-medium focus:text-accent-dark focus:ring-2 focus:ring-accent/40"
      >
        Skip to main content
      </a>
      <header
        className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur"
        style={{ WebkitBackdropFilter: "blur(10px)" }}
      >
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image src="/logo.png" alt="Signature Cleans" width={34} height={34} priority />
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-[13px] font-semibold tracking-[-0.005em]">Signature Cleans</span>
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-soft">
                  Client Portal
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
              <NavLink href="/dashboard">Overview</NavLink>
              <NavLink href="/documents">Documents</NavLink>
              <NavLink href="/audits">Audits</NavLink>
              <NavLink href="/activity">Activity</NavLink>
              {session.is_super_admin && <NavLink href="/admin">Admin</NavLink>}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {activeClient && (
              <div className="hidden lg:flex flex-col text-right leading-tight">
                <span className="text-[12px] font-medium">{activeClient.name}</span>
                <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-text-soft">
                  {activeClient.contract_ref ?? activeClient.cell_type ?? "Contract"}
                </span>
              </div>
            )}
            {!activeClient && session.is_super_admin && (
              <div className="hidden lg:flex flex-col text-right leading-tight">
                <span className="text-[12px] font-medium">Super Admin</span>
                <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-text-soft">
                  All Clients
                </span>
              </div>
            )}
            <div className="relative flex items-center gap-2">
              <div
                className="w-[34px] h-[34px] rounded-full bg-accent-soft text-accent-dark inline-flex items-center justify-center text-[13px] font-semibold border border-[#d0e2d1]"
                aria-hidden
              >
                {initial}
              </div>
              <form action="/api/auth/logout" method="POST">
                <button className="text-[12px] text-text-muted hover:text-text transition-colors" type="submit">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden border-t border-border bg-white" aria-label="Primary mobile">
          <div className="max-w-[1280px] mx-auto px-4 flex items-center gap-1 overflow-x-auto">
            <NavLink href="/dashboard">Overview</NavLink>
            <NavLink href="/documents">Documents</NavLink>
            <NavLink href="/audits">Audits</NavLink>
            <NavLink href="/activity">Activity</NavLink>
            {session.is_super_admin && <NavLink href="/admin">Admin</NavLink>}
          </div>
        </nav>
      </header>

      {session.is_super_admin && session.impersonating_client_id && activeClient && (
        <ImpersonationBanner clientName={activeClient.name} />
      )}

      <main id="main-content" className="flex-1 max-w-[1280px] w-full mx-auto px-6 md:px-10 py-8 md:py-10">
        {children}
      </main>

      <footer className="border-t border-border bg-white">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[11px] font-mono tracking-[0.04em] text-text-soft">
          <span>SIGNATURE-CLEANS.CO.UK</span>
          <span>PEACE OF MIND · EVERY TIME</span>
        </div>
      </footer>
    </div>
  );
}
