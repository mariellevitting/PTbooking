"use client";

import { useState } from "react";
import { Search, ChevronDown, Target } from "lucide-react";
import PoengNivaa from "@/components/PoengNivaa";

function isDone(goal: string) { return goal.startsWith("[x] "); }
function goalText(goal: string) { return isDone(goal) ? goal.slice(4) : goal; }
function parseGoals(raw: string | null) {
  return (raw ?? "").split("\n").map(g => g.trim()).filter(g => g !== "");
}
function getNeeded(level: number) {
  if (level === 0) return 8;
  if (level === 1) return 14;
  if (level === 2) return 28;
  return 0;
}

interface Person {
  id: string;
  name: string;
  avatar_url: string | null;
  season_goals: string | null;
  role: string;
  parentName?: string | null;
  points_freestyle: number;
  points_slow: number;
  level_freestyle: number;
  level_slow: number;
}

function subtitle(p: Person) {
  if (p.role === "child") return p.parentName ? `Barn · ${p.parentName}` : "Barn";
  if (p.role === "parent") return "Forelder";
  return "Danser";
}

function Row({ p }: { p: Person }) {
  const [open, setOpen] = useState(false);
  const goals = parseGoals(p.season_goals);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-3.5 text-left"
      >
        <div className="w-10 h-10 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center overflow-hidden flex-shrink-0">
          {p.avatar_url
            ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
            : <span className="text-sm font-bold text-[#E2A9F1]">{p.name.charAt(0)}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{p.name}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{subtitle(p)}</p>
        </div>
        {goals.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
            <Target size={13} />{goals.length}
          </span>
        )}
        <ChevronDown
          size={18}
          className={`text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t dark:border-gray-700 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-3 mb-2">Sesongmål</p>
            {goals.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Ingen mål delt ennå</p>
            ) : (
              <ul className="space-y-1.5">
                {goals.map((goal, i) => {
                  const done = isDone(goal);
                  return (
                    <li key={i} className="flex items-center justify-between gap-2 text-sm py-0.5">
                      <span className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-[#c87de0] mt-0.5">•</span>
                        {goalText(goal)}
                      </span>
                      {done && <span className="text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">Mål nådd</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-4 pt-1">
            <PoengNivaa label="Freestyle" points={p.points_freestyle} level={p.level_freestyle} needed={getNeeded(p.level_freestyle)} readOnly />
            <PoengNivaa label="Slow" points={p.points_slow} level={p.level_slow} needed={getNeeded(p.level_slow)} readOnly />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SesongmalSearch({ profiles, children = [] }: { profiles: Person[]; children?: Person[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const all: Person[] = [...profiles, ...children].sort((a, b) => a.name.localeCompare(b.name, "nb"));
  const filtered = q
    ? all.filter(p => p.name.toLowerCase().includes(q) || p.parentName?.toLowerCase().includes(q))
    : all;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Søk etter navn..."
          className="w-full pl-9 pr-4 py-2.5 border dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5 text-center text-gray-400 dark:text-gray-500">
          <p className="text-sm">Ingen treff på «{query.trim()}»</p>
        </div>
      ) : (
        filtered.map(p => <Row key={`${p.role}-${p.id}`} p={p} />)
      )}
    </div>
  );
}
