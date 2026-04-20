"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Folder,
  FileText,
  FileImage,
  FileSpreadsheet,
  File as FileIcon,
  Search,
  X,
  ChevronLeft,
  ArrowUpDown
} from "lucide-react";
import { formatRelative, formatFileSize, categoryChip } from "@/lib/format";

export type DocRow = {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  category: string | null;
  folder: string | null;
  last_modified: string | null;
  synced_at: string;
};

type Props = {
  docs: DocRow[];
  clientName: string;
};

type SortKey = "updated-desc" | "name-asc" | "size-desc";

const SORT_LABELS: Record<SortKey, string> = {
  "updated-desc": "Recently updated",
  "name-asc": "Name (A–Z)",
  "size-desc": "Largest first"
};

function docKind(name: string, type: string | null): "pdf" | "image" | "sheet" | "doc" | "other" {
  const n = name.toLowerCase();
  const t = (type ?? "").toLowerCase();
  if (n.endsWith(".pdf") || t === "pdf") return "pdf";
  if (/\.(png|jpe?g|gif|webp|svg|bmp|heic)$/i.test(name) || t.startsWith("image")) return "image";
  if (/\.(xlsx?|csv|numbers)$/i.test(name)) return "sheet";
  if (/\.(docx?|txt|rtf|pages)$/i.test(name)) return "doc";
  return "other";
}

function DocIcon({ name, type }: { name: string; type: string | null }) {
  const kind = docKind(name, type);
  const className = "h-5 w-5";
  if (kind === "pdf") return <FileText className={`${className} text-[#a33a2a]`} strokeWidth={1.5} />;
  if (kind === "image") return <FileImage className={`${className} text-[#294867]`} strokeWidth={1.5} />;
  if (kind === "sheet") return <FileSpreadsheet className={`${className} text-[#1f4721]`} strokeWidth={1.5} />;
  if (kind === "doc") return <FileText className={`${className} text-[#5a3a74]`} strokeWidth={1.5} />;
  return <FileIcon className={`${className} text-text-muted`} strokeWidth={1.5} />;
}

export default function DocumentsBrowser({ docs, clientName }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("updated-desc");

  // Build category counts from the full dataset (so filter chips stay stable).
  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of docs) {
      const key = d.category ?? "uncategorised";
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [docs]);

  // Folders with counts + newest-modified timestamp (for folder card subline).
  const folders = useMemo(() => {
    const m = new Map<string, { count: number; latest: number }>();
    for (const d of docs) {
      const key = d.folder ?? "Uncategorised";
      const t = new Date(d.last_modified ?? d.synced_at).getTime();
      const existing = m.get(key);
      if (existing) {
        existing.count += 1;
        if (t > existing.latest) existing.latest = t;
      } else {
        m.set(key, { count: 1, latest: t });
      }
    }
    return Array.from(m.entries())
      .map(([name, v]) => ({ name, count: v.count, latest: v.latest }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [docs]);

  // Filtered + sorted working set based on search, category, folder.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hit = docs.filter((d) => {
      if (activeCategory) {
        const k = d.category ?? "uncategorised";
        if (k !== activeCategory) return false;
      }
      if (activeFolder && (d.folder ?? "Uncategorised") !== activeFolder) return false;
      if (q) {
        if (
          !d.file_name.toLowerCase().includes(q) &&
          !(d.folder ?? "").toLowerCase().includes(q) &&
          !(d.category ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });

    const sorted = [...hit];
    if (sort === "name-asc") {
      sorted.sort((a, b) => a.file_name.localeCompare(b.file_name));
    } else if (sort === "size-desc") {
      sorted.sort((a, b) => (b.file_size ?? 0) - (a.file_size ?? 0));
    } else {
      sorted.sort((a, b) => {
        const ta = new Date(a.last_modified ?? a.synced_at).getTime();
        const tb = new Date(b.last_modified ?? b.synced_at).getTime();
        return tb - ta;
      });
    }
    return sorted;
  }, [docs, query, activeCategory, activeFolder, sort]);

  const isSearching = query.trim().length > 0;
  const isFiltering = activeCategory !== null;
  // Show flat list if: search active, category filter active, or a folder is selected.
  const showFlatList = isSearching || isFiltering || activeFolder !== null;

  function clearFilters() {
    setQuery("");
    setActiveCategory(null);
    setActiveFolder(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="label-xs">Library</span>
          <h1 className="mt-3 text-[26px] md:text-[30px] font-semibold tracking-[-0.015em]">
            Documents
          </h1>
          <p className="text-[13.5px] text-text-muted mt-1">
            {docs.length} file{docs.length === 1 ? "" : "s"} from {clientName}
            {(isSearching || isFiltering || activeFolder) && (
              <>
                {" "}
                ·{" "}
                <span className="text-text-strong">
                  {filtered.length} match{filtered.length === 1 ? "" : "es"}
                </span>
              </>
            )}
          </p>
        </div>
      </header>

      {/* Controls row */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-soft pointer-events-none"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files, folders, categories…"
              className="input input-search w-full"
              aria-label="Search documents"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 btn-icon"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="label-xs hidden sm:inline-flex items-center gap-1.5">
              <ArrowUpDown className="h-3 w-3" strokeWidth={2} aria-hidden /> Sort
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="input h-[40px] py-0 text-[13px] font-medium pr-8 min-w-[170px]"
              aria-label="Sort by"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category chips */}
        {categoryCounts.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`chip ${activeCategory === null ? "chip-good" : "chip-neutral"} cursor-pointer`}
              aria-pressed={activeCategory === null}
            >
              All ({docs.length})
            </button>
            {categoryCounts.map(([cat, count]) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(isActive ? null : cat)}
                  className={`${categoryChip(cat === "uncategorised" ? null : cat)} cursor-pointer transition-all ${
                    isActive ? "ring-2 ring-accent/40 shadow-e1" : "opacity-80 hover:opacity-100"
                  }`}
                  aria-pressed={isActive}
                >
                  {cat === "uncategorised" ? "Uncategorised" : cat} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Active filter breadcrumb */}
        {(isSearching || isFiltering || activeFolder) && (
          <div className="flex items-center gap-2 flex-wrap text-[12px] text-text-muted">
            {activeFolder && (
              <button
                type="button"
                onClick={() => setActiveFolder(null)}
                className="btn btn-ghost btn-sm"
              >
                <ChevronLeft className="h-3.5 w-3.5 -ml-1" strokeWidth={2} aria-hidden />
                <span>All folders</span>
              </button>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-[12px] text-accent-dark font-medium hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {docs.length === 0 ? (
        <div className="card">
          <div className="py-12 text-center text-[13px] text-text-soft">
            No documents have been synced yet. Your site pack, policies, insurance and audits
            will appear here as they are uploaded.
          </div>
        </div>
      ) : !showFlatList ? (
        /* Folder grid view */
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {folders.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => setActiveFolder(f.name)}
                className="folder-card text-left"
                aria-label={`Open ${f.name}, ${f.count} file${f.count === 1 ? "" : "s"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="folder-card-icon">
                    <Folder className="h-5 w-5 text-accent-dark" strokeWidth={1.75} aria-hidden />
                  </div>
                  <span className="text-[11px] font-mono text-text-soft tabular-nums">
                    {f.count}
                  </span>
                </div>
                <div className="mt-auto pt-4">
                  <div className="folder-card-title">{f.name}</div>
                  <div className="folder-card-meta">
                    Updated {formatRelative(new Date(f.latest).toISOString())}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        /* Flat list view */
        <section className="card">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-[12.5px] text-text-soft">
              No documents match your filters.{" "}
              <button
                type="button"
                onClick={clearFilters}
                className="text-accent-dark font-medium hover:underline"
              >
                Reset
              </button>
              .
            </div>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map((d) => (
                <li key={d.id} className="doc-row">
                  <div className="doc-row-icon">
                    <DocIcon name={d.file_name} type={d.file_type} />
                  </div>
                  <div className="min-w-0">
                    <div className="doc-row-title">{d.file_name}</div>
                    <div className="doc-row-meta flex items-center gap-2 flex-wrap">
                      {d.category && (
                        <span className={categoryChip(d.category)}>{d.category}</span>
                      )}
                      <span className="truncate">{d.folder ?? "Uncategorised"}</span>
                      <span aria-hidden>·</span>
                      <span>{formatFileSize(d.file_size)}</span>
                      <span aria-hidden>·</span>
                      <span>{formatRelative(d.last_modified ?? d.synced_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/documents/${d.id}/view`}
                      className="btn btn-ghost btn-sm"
                      prefetch={false}
                    >
                      View
                    </Link>
                    <Link
                      href={`/api/documents/${d.id}/download?force=1`}
                      className="btn btn-ghost btn-sm hidden sm:inline-flex"
                      prefetch={false}
                    >
                      Download
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
