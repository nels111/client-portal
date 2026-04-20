export default function ImpersonationBanner({ clientName }: { clientName: string }) {
  return (
    <div
      className="border-b border-[#f3d57a] bg-[#fdf7e2] text-[#6b5200]"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-2 flex items-center justify-between gap-3 text-[12px]">
        <span>
          <strong className="font-semibold">Admin view:</strong> you are viewing{" "}
          <strong className="font-semibold">{clientName}</strong> as a client.
        </span>
        <form action="/api/admin/stop-impersonating" method="POST">
          <button type="submit" className="underline font-medium">
            Return to admin
          </button>
        </form>
      </div>
    </div>
  );
}
