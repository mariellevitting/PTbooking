"use client";

import { useState } from "react";
import GoalsList from "@/components/GoalsList";

export type GoalKey = "season" | "freestyle" | "slow";
export type GoalValues = Record<GoalKey, string>;

const TABS: { key: GoalKey; label: string }[] = [
  { key: "season", label: "Sesong" },
  { key: "freestyle", label: "Freestyle" },
  { key: "slow", label: "Slow" },
];

const HINTS: Record<GoalKey, string> = {
  season: "Hva vil du klare i løpet av sesongen? Huk av når du har klart målet.",
  freestyle: "Triks og teknikk du vil lære, og hva du vil oppnå på konkurranser i freestyle, f.eks. komme til finale eller ta pallplass.",
  slow: "Teknikk og uttrykk du vil jobbe med, og hva du vil oppnå på konkurranser i slow, f.eks. gå videre fra første runde eller nå finalen.",
};

export default function GoalsTabs({ values, onChange }: { values: GoalValues; onChange: (key: GoalKey, val: string) => void }) {
  const [tab, setTab] = useState<GoalKey>("season");
  return (
    <div>
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-3">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-white dark:bg-gray-900 text-[#c87de0] shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{HINTS[tab]}</p>
      <GoalsList key={tab} value={values[tab]} onChange={val => onChange(tab, val)} />
    </div>
  );
}
