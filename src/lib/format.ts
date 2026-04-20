const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

const DATETIME_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FMT.format(date);
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return DATETIME_FMT.format(date);
}

export function formatRelative(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  const abs = Math.abs(sec);
  if (abs < 60) return sec >= 0 ? "just now" : "in a moment";
  if (abs < 3600) {
    const m = Math.round(abs / 60);
    return sec >= 0 ? `${m}m ago` : `in ${m}m`;
  }
  if (abs < 86400) {
    const h = Math.round(abs / 3600);
    return sec >= 0 ? `${h}h ago` : `in ${h}h`;
  }
  if (abs < 86400 * 7) {
    const days = Math.round(abs / 86400);
    return sec >= 0 ? `${days}d ago` : `in ${days}d`;
  }
  return formatDate(date);
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const CATEGORY_BASE =
  "inline-flex items-center px-2 py-[2px] rounded-[6px] text-[10.5px] font-medium tracking-[0.02em] border";

const CATEGORY_STYLES: Record<string, string> = {
  "site pack": "bg-accent-soft text-accent-dark border-[#d0e2d1]",
  "scope of works": "bg-accent-soft text-accent-dark border-[#d0e2d1]",
  contract: "bg-[#eef2f7] text-[#294867] border-[#d5dfeb]",
  quote: "bg-[#eef2f7] text-[#294867] border-[#d5dfeb]",
  insurance: "bg-[#f7eee4] text-[#6b4a1a] border-[#e8d5b8]",
  policy: "bg-[#f3eef7] text-[#5a3a74] border-[#dfd0ea]",
  certificate: "bg-[#eef7f3] text-[#1c5f47] border-[#c7e4d6]",
  audit: "bg-[#eaf3eb] text-[#1f4721] border-[#cde0d0]",
  training: "bg-[#fdf7e2] text-[#6b5200] border-[#f3d57a]",
  other: "bg-surface-muted text-text-muted border-border"
};

export function categoryChip(category: string | null | undefined): string {
  if (!category) return `${CATEGORY_BASE} ${CATEGORY_STYLES.other}`;
  const key = category.toLowerCase().trim();
  const style = CATEGORY_STYLES[key] ?? CATEGORY_STYLES.other;
  return `${CATEGORY_BASE} ${style}`;
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
