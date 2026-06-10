"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function GoalsList({ value, onChange }: Props) {
  const goals = value ? value.split("\n").filter(g => g.trim() !== "") : [];
  const [newGoal, setNewGoal] = useState("");

  function addGoal() {
    if (!newGoal.trim()) return;
    const updated = [...goals, newGoal.trim()];
    onChange(updated.join("\n"));
    setNewGoal("");
  }

  function removeGoal(idx: number) {
    const updated = goals.filter((_, i) => i !== idx);
    onChange(updated.join("\n"));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); addGoal(); }
  }

  return (
    <div className="space-y-2">
      {goals.length === 0 && (
        <p className="text-sm text-gray-400 py-1">Ingen mål lagt til ennå</p>
      )}
      {goals.map((goal, idx) => (
        <div key={idx} className="flex items-start gap-2 bg-purple-50 rounded-lg px-3 py-2">
          <span className="text-purple-400 mt-0.5 shrink-0">•</span>
          <span className="text-sm text-gray-700 flex-1">{goal}</span>
          <button type="button" onClick={() => removeGoal(idx)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-0.5">
            <X size={14} />
          </button>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <input
          type="text"
          value={newGoal}
          onChange={e => setNewGoal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Legg til et mål..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          type="button"
          onClick={addGoal}
          disabled={!newGoal.trim()}
          className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-colors shrink-0"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
