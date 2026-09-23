"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, HelpCircle } from "lucide-react";

const FINALE = [
  { plass: "1.", vanlig: 7, direkte: 5 },
  { plass: "2.", vanlig: 5, direkte: 3 },
  { plass: "3.", vanlig: 4, direkte: 2 },
  { plass: "4.", vanlig: 3, direkte: 1 },
  { plass: "5.", vanlig: 2, direkte: 1 },
  { plass: "6.", vanlig: 1, direkte: 1 },
  { plass: "7.", vanlig: 1, direkte: 1 },
  { plass: "8.", vanlig: 1, direkte: 1 },
];

export default function PoengForklaring() {
  const t = useTranslations("poengForklaring");
  const tl = useTranslations("levels");
  const LEVELS = tl.raw("names") as string[];
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 border-t dark:border-gray-700 pt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-medium text-[#9b59c4] dark:text-[#E2A9F1]"
      >
        <HelpCircle size={15} />
        {t("toggle")}
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>
            {t("intro")}
          </p>

          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{t("levelsHeading")}</p>
            <ul className="space-y-0.5">
              <li>{t.rich("levelStep", { from: LEVELS[0], to: LEVELS[1], points: 8, b: (c) => <strong>{c}</strong> })}</li>
              <li>{t.rich("levelStep", { from: LEVELS[1], to: LEVELS[2], points: 14, b: (c) => <strong>{c}</strong> })}</li>
              <li>{t.rich("levelStep", { from: LEVELS[2], to: LEVELS[3], points: 28, b: (c) => <strong>{c}</strong> })}</li>
              <li>{t.rich("topLevelsRule", { champ: LEVELS[3], elite: LEVELS[4], b: (c) => <strong>{c}</strong> })}</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{t("pointsPerPlacement")}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 dark:text-gray-500">
                    <th className="py-1 pr-4 font-medium">{t("place")}</th>
                    <th className="py-1 pr-4 font-medium">{t("regularFinal")}</th>
                    <th className="py-1 font-medium">{t("directFinal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {FINALE.map(r => (
                    <tr key={r.plass} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="py-1 pr-4">{r.plass}</td>
                      <td className="py-1 pr-4">{r.vanlig}</td>
                      <td className="py-1">{r.direkte}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {t("directFinalHint")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
