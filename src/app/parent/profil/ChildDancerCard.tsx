"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Trophy, Check, ChevronLeft } from "lucide-react";
import PointsStepper from "@/components/PointsStepper";
import CompetitionResultsCard from "@/components/CompetitionResultsCard";
import GoalsList from "@/components/GoalsList";

const LEVELS = ["Rekrutt", "Litt øvet", "Mester", "Champ", "Elite"];

function getNeeded(level: number, isFreestyle: boolean) {
  if (level === 0) return 8;
  if (level === 1) return 14;
  if (level === 2) return isFreestyle ? 21 : 28;
  return 0;
}

type Result = { id: string; competition_name: string; placement_freestyle: string | null; placement_slow: string | null; notes: string | null };
type Child = { id: string; name: string; season_goals: string | null; points_freestyle: number | null; points_slow: number | null; level_freestyle: number | null; level_slow: number | null };

export default function ChildDancerCard({ parentId, children, hideResults, hideGoals }: { parentId: string; children: Child[]; hideResults?: boolean; hideGoals?: boolean }) {
  const [selectedId, setSelectedId] = useState(children[0]?.id ?? "");
  const child = children.find(c => c.id === selectedId);

  const [goals, setGoals] = useState(child?.season_goals ?? "");
  const [freestyle, setFreestyle] = useState(child?.points_freestyle ?? 0);
  const [slow, setSlow] = useState(child?.points_slow ?? 0);
  const [levelF, setLevelF] = useState(child?.level_freestyle ?? 0);
  const [levelS, setLevelS] = useState(child?.level_slow ?? 0);
  const [results, setResults] = useState<Result[]>([]);
  const [resultsLoaded, setResultsLoaded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (selectedId) loadChild(selectedId);
  }, []);

  async function loadChild(id: string) {
    const c = children.find(x => x.id === id);
    if (!c) return;
    setSelectedId(id);
    setGoals(c.season_goals ?? "");
    setFreestyle(c.points_freestyle ?? 0);
    setSlow(c.points_slow ?? 0);
    setLevelF(c.level_freestyle ?? 0);
    setLevelS(c.level_slow ?? 0);
    setSuccess(false);
    if (resultsLoaded !== id) {
      const supabase = createClient();
      const { data } = await supabase.from("competition_results").select("*").eq("child_id", id).order("created_at", { ascending: false });
      setResults(data ?? []);
      setResultsLoaded(id);
    }
  }

  function handleFreestyleChange(val: number) {
    setSuccess(false);
    if (val < 0) { setLevelF(l => Math.max(0, l - 1)); setFreestyle(0); return; }
    const needed = getNeeded(levelF, true);
    if (levelF < 3 && val >= needed) { setLevelF(l => Math.min(l + 1, 4)); setFreestyle(0); }
    else setFreestyle(val);
  }

  function handleSlowChange(val: number) {
    setSuccess(false);
    if (val < 0) { setLevelS(l => Math.max(0, l - 1)); setSlow(0); return; }
    const needed = getNeeded(levelS, false);
    if (levelS < 3 && val >= needed) { setLevelS(l => Math.min(l + 1, 4)); setSlow(0); }
    else setSlow(val);
  }

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    setSuccess(false);
    const supabase = createClient();
    await supabase.from("children").update({
      season_goals: goals,
      points_freestyle: freestyle,
      points_slow: slow,
      level_freestyle: levelF,
      level_slow: levelS,
    }).eq("id", selectedId);
    setSaving(false);
    setSuccess(true);
  }

  if (children.length === 0) return null;

  const neededF = getNeeded(levelF, true);
  const percentF = neededF > 0 ? Math.round((Math.min(freestyle, neededF) / neededF) * 100) : 100;
  const neededS = getNeeded(levelS, false);
  const percentS = neededS > 0 ? Math.round((Math.min(slow, neededS) / neededS) * 100) : 100;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Mine dansere</h2>

      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map(c => (
            <button key={c.id} onClick={() => loadChild(c.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedId === c.id ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A]" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#E2A9F1]"}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      {children.length === 1 && <p className="text-base font-semibold text-gray-700 dark:text-gray-300">{children[0].name}</p>}

      {!hideGoals && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target size={16} className="text-[#E2A9F1]" /> Sesongmål
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">F.eks. triks, mål for konkurranser, hva danseren vil jobbe med</p>
            <GoalsList value={goals} onChange={setGoals} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy size={16} className="text-[#E2A9F1]" /> Poeng og nivåer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { label: "Freestyle", points: freestyle, level: levelF, percent: percentF, needed: neededF, onChange: handleFreestyleChange, disc: "freestyle" as const },
            { label: "Slow", points: slow, level: levelS, percent: percentS, needed: neededS, onChange: handleSlowChange, disc: "slow" as const },
          ].map(({ label, points, level, percent, needed, onChange, disc }, idx) => (
            <div key={label} className={idx > 0 ? "border-t dark:border-gray-700 pt-6" : ""}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
                  <span className="text-xs font-bold text-[#E2A9F1] bg-[#f5eeff] dark:bg-[#E2A9F1]/10 px-2 py-0.5 rounded-full">{LEVELS[level]}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] px-0.5">
                    {LEVELS.map((name, i) => <span key={i} className={i <= level ? "text-[#E2A9F1] font-semibold" : "text-gray-400 dark:text-gray-500"}>{name}</span>)}
                  </div>
                  <div style={{ height: "12px", backgroundColor: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", backgroundColor: "#7c3aed", borderRadius: "9999px", width: `${Math.max(3, (level / 4) * 100 + (percent / 100) * (100 / 4))}%`, transition: "width 0.5s ease" }} />
                  </div>
                </div>
                <PointsStepper value={points} onChange={onChange} />
                {level >= 3 ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    <Trophy size={14} className="text-yellow-500" /> Neste nivå avgjøres av plasseringer på stevner
                  </div>
                ) : (
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{Math.min(points, needed)} / {needed} poeng mot {LEVELS[level + 1]}</span>
                    <span>{percent}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {!hideResults && <CompetitionResultsCard userId={parentId} childId={selectedId} initialResults={results} />}

      {success && (
        <div className="flex items-center gap-2 text-[#c87de0] text-sm bg-[#f5eeff] dark:bg-[#E2A9F1]/10 border border-[#E2A9F1]/40 rounded-xl p-3">
          <Check size={16} /> Lagret!
        </div>
      )}
      <Button onClick={handleSave} className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a]" disabled={saving || success}>
        {saving ? "Lagrer..." : "Lagre"}
      </Button>
    </div>
  );
}
