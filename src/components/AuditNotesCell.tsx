"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  notes: string | null;
  /**
   * Character length above which the "Read more" toggle appears.
   * Short notes render inline without any control.
   */
  previewLength?: number;
};

export default function AuditNotesCell({ notes, previewLength = 140 }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!notes || notes.trim().length === 0) {
    return <span className="text-text-soft">—</span>;
  }

  const needsToggle = notes.length > previewLength;
  const shown = expanded || !needsToggle ? notes : notes.slice(0, previewLength).trimEnd() + "…";

  return (
    <div className="space-y-1">
      <p className="whitespace-pre-wrap leading-snug text-text-muted">{shown}</p>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1 text-[11.5px] font-medium text-accent-dark hover:underline"
        >
          <span>{expanded ? "Show less" : "Read more"}</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
            strokeWidth={2}
            aria-hidden
          />
        </button>
      )}
    </div>
  );
}
