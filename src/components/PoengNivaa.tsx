"use client";

import { Fragment } from "react";
import { Trophy, Star } from "lucide-react";
import PointsStepper from "./PointsStepper";

const LEVELS = ["Rekrutt", "Litt øvet", "Mester", "Champ", "Elite"];

interface Props {
  label: string;
  points: number;
  level: number;
  needed: number;
  onChange?: (val: number) => void;
  onLevelChange?: (level: number) => void;
  readOnly?: boolean;
}

export default function PoengNivaa({ label, points, level, needed, onChange, onLevelChange, readOnly }: Props) {
  const topLevel = level >= 3;
  const clickable = !readOnly && !!onLevelChange;
  const shown = Math.min(points, needed);
  const pct = needed > 0 ? Math.round((shown / needed) * 100) : 0;

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>

      {/* Nivåsti med delvis fylt strek på aktivt nivå. Prikkene er klikkbare når nivå kan endres. */}
      <div className="flex items-center mt-3 mb-1.5">
        {LEVELS.map((name, i) => {
          const dotClass = `rounded-full shrink-0 transition-all ${
            i === level
              ? "w-7 h-7 bg-[#c87de0] ring-4 ring-[#f0dcf8] dark:ring-[#E2A9F1]/25"
              : i < level
              ? "w-6 h-6 bg-[#c87de0]"
              : clickable
              ? "w-6 h-6 bg-white dark:bg-gray-900 border-2 border-[#d9b4ec] dark:border-[#E2A9F1]/50"
              : "w-6 h-6 border-2 border-gray-300 dark:border-gray-600"
          }`;
          return (
            <Fragment key={i}>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => i !== level && onLevelChange!(i)}
                  aria-label={`Velg nivå ${name}`}
                  aria-pressed={i === level}
                  className={`${dotClass} ${i !== level ? "active:scale-90 hover:ring-4 hover:ring-[#f0dcf8] dark:hover:ring-[#E2A9F1]/20" : ""}`}
                />
              ) : (
                <span className={dotClass} />
              )}
              {i < LEVELS.length - 1 && (
                i < level ? (
                  <span className="flex-1 h-[3px] bg-[#c87de0]" />
                ) : i === level && !topLevel ? (
                  <span className="flex-1 h-[3px] bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <span className="block h-full bg-[#c87de0] transition-all duration-500" style={{ width: `${pct}%` }} />
                  </span>
                ) : (
                  <span className="flex-1 h-[3px] bg-gray-200 dark:bg-gray-700" />
                )
              )}
            </Fragment>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] mb-1">
        {LEVELS.map((name, i) => (
          clickable ? (
            <button key={i} type="button" onClick={() => i !== level && onLevelChange!(i)}
              className={i === level ? "text-[#c87de0] font-semibold" : "text-gray-400 dark:text-gray-500"}>
              {name}
            </button>
          ) : (
            <span key={i} className={i === level ? "text-[#c87de0] font-semibold" : "text-gray-400 dark:text-gray-500"}>
              {name}
            </span>
          )
        ))}
      </div>
      {clickable && <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mb-3">Trykk på et nivå for å velge det</p>}
      {!clickable && <div className="mb-2" />}

      {topLevel ? (
        <>
          <div className="flex flex-col items-center justify-center rounded-xl bg-[#3A3A3A] py-4 mb-3">
            {level >= 4
              ? <Star size={24} className="text-[#E2A9F1]" />
              : <Trophy size={24} className="text-[#E2A9F1]" />}
            <p className="text-2xl font-semibold text-[#E2A9F1] mt-1">{LEVELS[level]}</p>
          </div>
          {!readOnly && onLevelChange && (
            <>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                {[3, 4].map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => onLevelChange(l)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      level === l ? "bg-white dark:bg-gray-900 text-[#9b59c4] dark:text-[#E2A9F1] shadow-sm" : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {LEVELS[l]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onLevelChange(2)}
                className="block mx-auto mt-2.5 text-xs text-gray-400 dark:text-gray-500 underline"
              >
                Tilbake til Mester
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-3">
            {shown} av {needed} poeng til {LEVELS[level + 1]}
          </p>
          {!readOnly && onChange && (
            <div className="flex justify-center">
              <PointsStepper value={points} onChange={onChange} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
