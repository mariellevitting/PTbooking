"use client";

import { Fragment } from "react";
import { Trophy } from "lucide-react";
import PointsStepper from "./PointsStepper";

const LEVELS = ["Rekrutt", "Litt øvet", "Mester", "Champ", "Elite"];

interface Props {
  label: string;
  points: number;
  level: number;
  needed: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
}

export default function PoengNivaa({ label, points, level, needed, onChange, readOnly }: Props) {
  const shown = Math.min(points, needed);
  const pct = needed > 0 ? Math.round((shown / needed) * 100) : 0;

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>

      {/* Nivåsti med delvis fylt strek på aktivt nivå */}
      <div className="flex items-center mt-3 mb-1.5">
        {LEVELS.map((_, i) => (
          <Fragment key={i}>
            <span
              className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                i <= level ? "bg-[#c87de0]" : "border-2 border-gray-300 dark:border-gray-600"
              }`}
            />
            {i < LEVELS.length - 1 && (
              i < level ? (
                <span className="flex-1 h-[3px] bg-[#c87de0]" />
              ) : i === level ? (
                <span className="flex-1 h-[3px] bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <span className="block h-full bg-[#c87de0] transition-all duration-500" style={{ width: `${pct}%` }} />
                </span>
              ) : (
                <span className="flex-1 h-[3px] bg-gray-200 dark:bg-gray-700" />
              )
            )}
          </Fragment>
        ))}
      </div>
      <div className="flex justify-between text-[10px] mb-3">
        {LEVELS.map((name, i) => (
          <span key={i} className={i === level ? "text-[#c87de0] font-semibold" : "text-gray-400 dark:text-gray-500"}>
            {name}
          </span>
        ))}
      </div>

      {level >= 4 ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-3">Øverste nivå 🎉</p>
      ) : level === 3 ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/30 rounded-lg px-3 py-2 mb-3">
          <Trophy size={14} className="text-yellow-500 dark:text-yellow-600" /> Neste nivå avgjøres av ranking på stevner
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-3">
          {shown} av {needed} poeng til {LEVELS[level + 1]}
        </p>
      )}

      {!readOnly && onChange && (
        <div className="flex justify-center">
          <PointsStepper value={points} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
