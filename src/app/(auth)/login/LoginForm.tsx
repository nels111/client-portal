"use client";

import { useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.error ?? "Something went wrong. Try again shortly.");
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setErrorMsg("Network error. Try again.");
      setStatus("error");
    }
  }

  return (
    <>
      {status === "sent" && (
        <div
          className="mb-4 rounded-xl px-[14px] py-[14px] text-[13px]"
          role="status"
          aria-live="polite"
          style={{
            border: "1px solid #d0e2d1",
            background: "var(--accent-soft)",
            color: "var(--accent-dark)"
          }}
        >
          <strong className="block mb-1 font-semibold">Magic link sent</strong>
          Check your inbox. The link stays valid for 15 minutes and your session will last 60 days on this device.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="email" className="block text-[12px] font-medium text-text-muted mb-[6px]">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          disabled={status === "sending"}
        />
        <button
          className="btn btn-primary w-full mt-[14px]"
          type="submit"
          disabled={status === "sending"}
        >
          <span>
            {status === "sending"
              ? "Sending…"
              : status === "sent"
              ? "Resend link"
              : "Send magic link"}
          </span>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 10h12m0 0l-4.5-4.5M16 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>

      {status === "error" && errorMsg && (
        <p className="mt-3 text-[12.5px] text-danger">{errorMsg}</p>
      )}

      <div
        className="mt-[14px] flex items-start gap-2 rounded-[10px] px-[12px] py-[10px] text-[12.5px] text-text-muted"
        style={{
          border: "1px solid var(--border)",
          background: "var(--surface-muted)"
        }}
      >
        <span
          className="mt-[7px] flex-shrink-0 inline-block w-[6px] h-[6px] rounded-full"
          style={{ background: "var(--accent)" }}
          aria-hidden
        />
        <span>Magic link auth, no passwords. Session stays signed in for 60 days on this device.</span>
      </div>
    </>
  );
}
