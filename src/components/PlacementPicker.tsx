"use client";

import { useState } from "react";
import { ROUNDS, FINALE_PLACES, roundOf, type Round } from "@/lib/placement";

export default function PlacementPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [round, setRound] = useState<Round | null>(roundOf(value));

  function pickRound(r: Round) {
    if (round === r) { setRound(null); onChange(""); return; }
    setRound(r);
    // Finale trenger plassering fra nedtrekksmenyen; de andre er ferdige med en gang
    onChange(r === "finale" ? "" : r);
  }

  const places = round === "finale" ? FINALE_PLACES : null;
  const placeValue = round === "finale" ? value : "";

  return (
    <div className="space-y-2">
      <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {ROUNDS.map(r => (
          <button
            key={r.key}
            type="button"
            onClick={() => pickRound(r.key)}
            aria-pressed={round === r.key}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              round === r.key
                ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A]"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#E2A9F1]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      {places && (
        <select
          value={placeValue}
          onChange={e => onChange(e.target.value)}
          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]"
        >
          <option value="">Velg plass</option>
          {places.map(n => <option key={n} value={String(n)}>{n}. plass</option>)}
        </select>
      )}
    </div>
  );
}
