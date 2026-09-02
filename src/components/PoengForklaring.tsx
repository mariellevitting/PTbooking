"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 border-t dark:border-gray-700 pt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-medium text-[#9b59c4] dark:text-[#E2A9F1]"
      >
        <HelpCircle size={15} />
        Hvordan fungerer poeng?
        <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Poeng kommer fra plasseringer på konkurranser. Freestyle og slow teller hver for seg.
            Du fører inn poengene dine selv med + og − etter hver konkurranse.
          </p>

          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Nivåer</p>
            <ul className="space-y-0.5">
              <li>Rekrutt → Litt øvet: <strong>8 poeng</strong></li>
              <li>Litt øvet → Mester: <strong>14 poeng</strong></li>
              <li>Mester → Champ: <strong>28 poeng</strong></li>
              <li>Champ og Elite: avgjøres av <strong>ranking</strong>, ikke poeng</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Poeng per plassering i finale</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 dark:text-gray-500">
                    <th className="py-1 pr-4 font-medium">Plass</th>
                    <th className="py-1 pr-4 font-medium">Vanlig finale</th>
                    <th className="py-1 font-medium">Direkte finale</th>
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
              Direkte finale brukes når det er få deltakere, slik at alle går rett til finale.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
