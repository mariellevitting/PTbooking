"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

function isDone(goal: string) { return goal.startsWith("[x] "); }
function goalText(goal: string) { return isDone(goal) ? goal.slice(4) : goal; }

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
    <div className="space-y-2">
      {goals.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-1">Ingen mål lagt til ennå</p>
      )}
      {goals.map((goal, idx) => {
        const done = isDone(goal);
        return (
          <div key={idx} className="flex items-center gap-2 py-1.5">
            <button
              type="button"
              onClick={() => toggleGoal(idx)}
              className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${done ? "bg-[#c87de0] border-[#c87de0] text-white" : "border-gray-300 dark:border-gray-600 hover:border-[#c87de0]"}`}
            >
              {done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
            <span className={`text-sm flex-1 ${done ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>
              {goalText(goal)}
            </span>
            {done && <span className="text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">Mål nådd</span>}
            <button type="button" onClick={() => removeGoal(idx)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors shrink-0 mt-0.5">
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
          className="flex-1 border dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]"
        />
        <button
          type="button"
          onClick={addGoal}
          disabled={!newGoal.trim()}
          className="w-10 h-10 bg-[#3A3A3A] hover:bg-[#2a2a2a] disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-colors shrink-0"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
