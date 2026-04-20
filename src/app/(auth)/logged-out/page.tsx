import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Signed out · Signature Cleans Portal"
};

export default function LoggedOutPage() {
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
        <div className="max-w-[460px] w-full card text-center">
          <span className="label-xs">Session ended</span>
          <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.015em]">
            You&apos;ve been signed out
          </h1>
          <p className="mt-3 text-[13.5px] text-text-muted leading-relaxed">
            Your portal session has ended securely. Thanks for stopping by.
          </p>

          <div className="mt-8">
            <Link href="/login" className="btn btn-primary w-full">
              Sign back in
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
