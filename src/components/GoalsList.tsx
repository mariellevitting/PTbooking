"use client";

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

function isDone(goal: string) { return goal.startsWith("[x] "); }
// "[ ] " kan forekomme i importerte data; behandles som ikke huket av
function goalText(goal: string) { return goal.startsWith("[x] ") || goal.startsWith("[ ] ") ? goal.slice(4) : goal; }

export default function GoalsList({ value, onChange }: Props) {
  const goals = value ? value.split("\n").filter(g => g.trim() !== "") : [];
  const [newGoal, setNewGoal] = useState("");

  function addGoal() {
    if (!newGoal.trim()) return;
    onChange([...goals, newGoal.trim()].join("\n"));
    setNewGoal("");
  }

  function removeGoal(idx: number) {
    onChange(goals.filter((_, i) => i !== idx).join("\n"));
  }

  function toggleGoal(idx: number) {
    const updated = goals.map((g, i) => {
      if (i !== idx) return g;
      return isDone(g) ? goalText(g) : `[x] ${g}`;
    });
    onChange(updated.join("\n"));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); addGoal(); }
  }

  function handleBlur() {
    if (newGoal.trim()) addGoal();
  }

  return (
    <div className="space-y-2.5">
      {goals.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-1">Ingen mål lagt til ennå</p>
      )}
      {/* Mål som pågår først, nådde mål nederst. idx peker fortsatt på originalrekkefølgen. */}
      {goals.map((goal, idx) => ({ goal, idx })).sort((x, y) => Number(isDone(x.goal)) - Number(isDone(y.goal))).map(({ goal, idx }) => {
        const done = isDone(goal);
        return (
          <div key={idx} className="flex items-center gap-3 rounded-[18px] bg-white/80 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700 px-3.5 py-3">
            <button
              type="button"
              onClick={() => toggleGoal(idx)}
              aria-label={done ? "Marker som ikke nådd" : "Marker som nådd"}
              aria-pressed={done}
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                done ? "bg-[#9b59c4] text-white" : "bg-white dark:bg-gray-900 border-2 border-[#d9b4ec] dark:border-[#E2A9F1]/50 hover:border-[#c87de0]"
              }`}
            >
              {done && <Check size={18} strokeWidth={3} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 break-words">{goalText(goal)}</p>
              {done && <p className="text-xs text-[#9b59c4] dark:text-[#E2A9F1]">Nådd</p>}
            </div>
            <button type="button" onClick={() => removeGoal(idx)} aria-label="Slett mål" className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors shrink-0">
              <X size={14} />
            </button>
          </div>
        );
      })}
      <div className="flex gap-2 pt-1">
        <input
          type="text"
          value={newGoal}
          onChange={e => setNewGoal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Legg til et mål..."
          className="flex-1 border border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-800/70 dark:text-white rounded-[14px] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]"
        />
        <button
          type="button"
          onClick={addGoal}
          disabled={!newGoal.trim()}
          className="w-11 h-11 bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] text-[#E2A9F1] dark:text-white disabled:opacity-40 rounded-[14px] flex items-center justify-center transition-colors shrink-0"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
