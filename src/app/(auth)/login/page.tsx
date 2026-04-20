import Image from "next/image";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign in · Signature Cleans Portal"
};

const features = [
  {
    title: "Audit visibility",
    body: "Every site audit with scoring, trends and photo evidence."
  },
  {
    title: "Live documentation",
    body: "Site packs, method statements, risk assessments, insurance, synced in real time."
  },
  {
    title: "Activity log",
    body: "Every clock-in, sign-off and incident, tied back to your contract."
  },
  {
    title: "Magic-link access",
    body: "No passwords. One link, one device, one minute. Session lasts 60 days."
  }
];

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* LEFT hero */}
      <aside
        className="relative overflow-hidden flex flex-col justify-between px-8 py-10 md:px-14 md:py-12 border-b md:border-b-0 md:border-r border-border"
        style={{
          background:
            "radial-gradient(1200px 600px at 10% -10%, rgba(44,95,45,0.08), transparent 60%), radial-gradient(900px 500px at 90% 110%, rgba(44,95,45,0.05), transparent 60%), linear-gradient(180deg, #fbfaf7 0%, #f4f2ec 100%)"
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(#e8e6e1 1px, transparent 1px), linear-gradient(90deg, #e8e6e1 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(600px 500px at 30% 50%, black, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(600px 500px at 30% 50%, black, transparent 80%)"
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <Image src="/logo.png" alt="Signature Cleans" width={56} height={56} priority />
        </div>

        <div className="relative z-10 max-w-[460px]">
          <span className="label-xs">Client Portal</span>
          <h1 className="mt-4 mb-3 text-[28px] md:text-[34px] leading-[1.1] font-semibold tracking-[-0.015em] text-text">
            Every audit, document and cleaning record for your site. In one place.
          </h1>
          <p className="text-[15px] text-text-muted max-w-[420px]">
            Secure access for Signature Cleans contract holders. Track audit scores, review site documentation, and keep visibility on every visit we make.
          </p>

          <ul className="mt-8 grid gap-4">
            {features.map((f) => (
              <li key={f.title} className="flex gap-3 items-start">
                <span className="flex-shrink-0 mt-[2px] w-[22px] h-[22px] rounded-full bg-accent-soft text-accent-dark inline-flex items-center justify-center border border-[#d0e2d1]">
                  <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <strong className="block text-sm font-semibold text-text tracking-[-0.005em] mb-[2px]">{f.title}</strong>
                  <span className="text-[13px] text-text-muted leading-[1.5]">{f.body}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex justify-between items-center text-[11px] text-text-soft font-mono tracking-[0.04em]">
          <span>SIGNATURE-CLEANS.CO.UK</span>
          <span>PEACE OF MIND · EVERY TIME</span>
        </div>
      </aside>

      {/* RIGHT form */}
      <main className="flex items-center justify-center px-6 py-10 md:px-8 md:py-12">
        <div className="w-full max-w-[400px]">
          <span className="label-xs">Secure sign in</span>
          <h2 className="mt-6 mb-[6px] text-[22px] font-semibold tracking-[-0.01em]">Sign in to your portal</h2>
          <p className="text-[13.5px] text-text-muted mb-7">
            Enter the email address linked to your contract. We'll send a one-time magic link. New here? The same link signs you in on first visit.
          </p>

          <LoginForm />

          <p className="mt-6 text-[11.5px] text-text-soft leading-[1.55]">
            By continuing you agree to Signature Cleans' client-portal terms and acceptable use policy. Need help? Contact your account lead at Signature Cleans.
          </p>
        </div>
      </main>
    </div>
  );
}
