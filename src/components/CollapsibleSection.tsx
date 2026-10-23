"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CollapsibleSection({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</span>
        <span className="flex items-center gap-2">
          {meta && <span className="text-xs text-gray-400 dark:text-gray-500">{meta}</span>}
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && <div className="px-3.5 pb-3.5">{children}</div>}
    </div>
  );
}
