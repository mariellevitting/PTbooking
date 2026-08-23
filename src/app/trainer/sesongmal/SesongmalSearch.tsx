"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";

function isDone(goal: string) { return goal.startsWith("[x] "); }
function goalText(goal: string) { return isDone(goal) ? goal.slice(4) : goal; }

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  season_goals: string | null;
  role: string;
}

export default function SesongmalSearch({ profiles }: { profiles: Profile[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? profiles.filter(p => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : profiles;

  return (
    <div className="space-y-4">
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

      {filtered.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5 text-center text-gray-400 dark:text-gray-500">
          <p className="text-sm">Ingen treff på «{query.trim()}»</p>
        </div>
      )}

      {filtered.map(p => {
        const goals = p.season_goals!.split("\n").filter(g => g.trim() !== "");
        return (
          <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4">
            <Link href={`/trainer/danser/${p.id}`} className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                {p.avatar_url
                  ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                  : <span className="text-sm font-bold text-[#E2A9F1]">{p.name.charAt(0)}</span>}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{p.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{p.role === "parent" ? "Forelder" : "Danser"}</p>
              </div>
            </Link>
            <ul className="space-y-1.5">
              {goals.map((goal, i) => {
                const done = isDone(goal);
                return (
                  <li key={i} className="flex items-center justify-between gap-2 text-sm py-1">
                    <span className="text-gray-700 dark:text-gray-300">{goalText(goal)}</span>
                    {done && <span className="text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">Mål nådd</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
