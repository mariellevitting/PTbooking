"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Target, Trophy } from "lucide-react";

const LEVELS = ["Rekrutt", "Litt øvet", "Mester", "Champ", "Elite"];

function getNeeded(levelIndex: number, isFreestyle: boolean): number {
  if (levelIndex === 0) return 8;
  if (levelIndex === 1) return 14;
  if (levelIndex === 2) return 28;
  return 0;
}

function LevelTracker({ label, points, level, isFreestyle, onPointsChange, onLevelUp }: {
  label: string;
  points: number;
  level: number;
  isFreestyle: boolean;
  onPointsChange: (val: number) => void;
  onLevelUp: () => void;
}) {
  const isChampOrElite = level >= 3;
  const needed = getNeeded(level, isFreestyle);
  const current = Math.min(points, needed);
  const percent = needed > 0 ? Math.round((current / needed) * 100) : 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
        <span className="text-xs font-bold text-[#E2A9F1] bg-[#f5eeff] dark:bg-[#E2A9F1]/10 px-2 py-0.5 rounded-full">
          {LEVELS[level]}
        </span>
      </div>

      {/* Progresjonsbar med nivånavn */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] px-0.5">
          {LEVELS.map((name, i) => (
            <span key={i} className={i <= level ? "text-[#E2A9F1] font-semibold" : "text-gray-400 dark:text-gray-500"}>{name}</span>
          ))}
        </div>
        <div style={{ height: "12px", backgroundColor: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            backgroundColor: "#7c3aed",
            borderRadius: "9999px",
            width: `${Math.max(3, (level / 4) * 100 + (percent / 100) * (100 / 4))}%`,
            transition: "width 0.5s ease"
          }} />
        </div>
      </div>

      {/* Poeng-input */}
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={0}
          value={points}
          onChange={e => onPointsChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-20 text-center border dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">poeng dette nivået</p>
      </div>

      {isChampOrElite ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          <Trophy size={14} className="text-yellow-500" />
          Neste nivå avgjøres av plasseringer på stevner
        </div>
      ) : (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{current} / {needed} poeng mot {LEVELS[level + 1]}</span>
          <span>{percent}%</span>
        </div>
      )}
    </div>
  );
}

interface Props {
  userId: string;
  seasonGoals: string;
  pointsFreestyle: number;
  pointsSlow: number;
  levelFreestyle: number;
  levelSlow: number;
}

export default function DancerGoalsCard({ userId, seasonGoals, pointsFreestyle, pointsSlow, levelFreestyle, levelSlow }: Props) {
  const [goals, setGoals] = useState(seasonGoals);
  const [freestyle, setFreestyle] = useState(pointsFreestyle);
  const [slow, setSlow] = useState(pointsSlow);
  const [levelF, setLevelF] = useState(levelFreestyle);
  const [levelS, setLevelS] = useState(levelSlow);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleFreestyleChange(val: number) {
    const needed = getNeeded(levelF, true);
    if (levelF < 3 && val >= needed) {
      setLevelF(l => Math.min(l + 1, 4));
      setFreestyle(0);
    } else {
      setFreestyle(val);
    }
  }

  function handleSlowChange(val: number) {
    const needed = getNeeded(levelS, false);
    if (levelS < 3 && val >= needed) {
      setLevelS(l => Math.min(l + 1, 4));
      setSlow(0);
    } else {
      setSlow(val);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    const supabase = createClient();
    await supabase.from("profiles").update({
      season_goals: goals,
      points_freestyle: freestyle,
      points_slow: slow,
      level_freestyle: levelF,
      level_slow: levelS,
    }).eq("id", userId);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="space-y-4">
      {/* Sesongmål */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target size={16} className="text-[#E2A9F1]" /> Mine sesongmål
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
            F.eks. triks du vil lære, mål for konkurranser, hva du vil jobbe med denne sesongen
          </p>
          <textarea
            value={goals}
            onChange={e => setGoals(e.target.value)}
            rows={4}
            placeholder="Skriv dine mål for sesongen her..."
            className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]"
          />
        </CardContent>
      </Card>

      {/* Poeng og nivåer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy size={16} className="text-[#E2A9F1]" /> Poeng og nivåer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <LevelTracker
            label="Freestyle"
            points={freestyle}
            level={levelF}
            isFreestyle={true}
            onPointsChange={handleFreestyleChange}
            onLevelUp={() => {}}
          />
          <div className="border-t dark:border-gray-700 pt-6">
            <LevelTracker
              label="Slow"
              points={slow}
              level={levelS}
              isFreestyle={false}
              onPointsChange={handleSlowChange}
              onLevelUp={() => {}}
            />
          </div>
        </CardContent>
      </Card>

      {success && (
        <div className="flex items-center gap-2 text-[#c87de0] text-sm bg-[#f5eeff] dark:bg-[#E2A9F1]/10 border border-[#E2A9F1]/40 rounded-xl p-3">
          <Check size={16} /> Lagret!
        </div>
      )}
      <Button onClick={handleSave} className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white" disabled={saving}>
        {saving ? "Lagrer..." : "Lagre mål og poeng"}
      </Button>
    </div>
  );
}
