import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NoAccessPage() {
  const session = await getSession();

  return (
    <main className="min-h-screen bg-bg flex flex-col">
      <header className="border-b border-border bg-white">
        <div className="max-w-[1080px] mx-auto px-6 md:px-10 h-[64px] flex items-center gap-3">
          <Image src="/logo.png" alt="Signature Cleans" width={32} height={32} priority />
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold tracking-[-0.005em]">Signature Cleans</span>
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-text-soft">
              Client Portal
            </span>
          </div>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-[560px] w-full card">
          <span className="label-xs">No access</span>
          <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.015em]">
            This account isn&apos;t linked to a client yet
          </h1>
          <p className="mt-3 text-[13.5px] text-text-muted leading-relaxed">
            You signed in as{" "}
            <span className="font-mono text-[12.5px] text-text">{session?.email ?? "unknown"}</span>
            , but we don&apos;t have a client record attached to this email address. If you believe
            this is a mistake, contact your Signature Cleans account manager and we&apos;ll link
            you up within the working day.
          </p>

          <div className="mt-6 space-y-3 text-[13px] text-text-muted">
            <div className="flex items-start gap-3">
              <span className="mt-[6px] w-[6px] h-[6px] rounded-full bg-accent flex-none" />
              <span>
                Portal access is provisioned by contract. Your welcome email contains the address
                your login must match.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-[6px] w-[6px] h-[6px] rounded-full bg-accent flex-none" />
              <span>
                To request a new account, email{" "}
                <a
                  className="text-accent-dark underline underline-offset-2"
                  href="mailto:hello@signature-cleans.co.uk"
                >
                  hello@signature-cleans.co.uk
                </a>
                .
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <form action="/api/auth/logout" method="POST" className="flex-1">
              <button type="submit" className="btn btn-primary w-full">
                Sign out
              </button>
            </form>
            <Link href="/login" className="btn btn-ghost flex-1 text-center">
              Try a different email
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-white">
        <div className="max-w-[1080px] mx-auto px-6 md:px-10 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[11px] font-mono tracking-[0.04em] text-text-soft">
          <span>SIGNATURE-CLEANS.CO.UK</span>
          <span>PEACE OF MIND · EVERY TIME</span>
        </div>
      </footer>
    </main>
  );
}
