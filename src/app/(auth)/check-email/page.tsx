import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CheckEmailPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

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
        <div className="max-w-[520px] w-full card">
          <span className="label-xs">Check your email</span>
          <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.015em]">
            We&apos;ve sent you a sign-in link
          </h1>
          <p className="mt-3 text-[13.5px] text-text-muted leading-relaxed">
            {email ? (
              <>
                A secure sign-in link is on its way to{" "}
                <span className="font-mono text-[12.5px] text-text">{email}</span>. Click the
                button in that email to continue.
              </>
            ) : (
              <>
                A secure sign-in link is on its way to your inbox. Click the button in that email
                to continue.
              </>
            )}
          </p>

          <div className="mt-6 rounded-[10px] border border-border bg-surface-muted/60 p-4 text-[12.5px] text-text-muted leading-relaxed">
            The link is valid for <span className="font-semibold">15 minutes</span> and can only be
            used once. If you don&apos;t see it within a minute, check your spam folder.
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/login" className="btn btn-ghost flex-1 text-center">
              Use a different email
            </Link>
            <a
              href="mailto:hello@signature-cleans.co.uk"
              className="btn btn-primary flex-1 text-center"
            >
              Contact support
            </a>
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
