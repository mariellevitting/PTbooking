"use client";

import { useState } from "react";
import GoalsList from "@/components/GoalsList";

export type GoalKey = "season" | "freestyle" | "slow";
export type GoalValues = Record<GoalKey, string>;

interface Props {
  values: GoalValues;
  onChange: (key: GoalKey, val: string) => void;
  // Noen klubber sporer andre stiler enn Freestyle/Slow (f.eks. Moveon).
  // Bytter kun visningsnavnet – dataene lagres fortsatt under "freestyle"/"slow".
  style1Label?: string;
  style2Label?: string;
  // Noen klubber vil bare ha ett generelt sesongmål-felt, ingen stil-faner.
  singleTab?: boolean;
}

export default function GoalsTabs({ values, onChange, style1Label = "Freestyle", style2Label = "Slow", singleTab = false }: Props) {
  const [tab, setTab] = useState<GoalKey>("season");

  if (singleTab) {
    return (
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
          Hva vil du klare i løpet av sesongen? Huk av når du har klart målet.
        </p>
        <GoalsList value={values.season} onChange={val => onChange("season", val)} />
      </div>
    );
  }

  const TABS: { key: GoalKey; label: string }[] = [
    { key: "season", label: "Sesong" },
    { key: "freestyle", label: style1Label },
    { key: "slow", label: style2Label },
  ];

  const HINTS: Record<GoalKey, string> = {
    season: "Hva vil du klare i løpet av sesongen? Huk av når du har klart målet.",
    freestyle: `Triks og teknikk du vil lære, og hva du vil oppnå på konkurranser i ${style1Label.toLowerCase()}, f.eks. komme til finale eller ta pallplass.`,
    slow: `Teknikk og uttrykk du vil jobbe med, og hva du vil oppnå på konkurranser i ${style2Label.toLowerCase()}, f.eks. gå videre fra første runde eller nå finalen.`,
  };

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
