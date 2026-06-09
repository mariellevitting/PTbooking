"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Trophy, Medal, Plus, Trash2, Check } from "lucide-react";

const LEVELS = ["Rekrutt", "Litt øvet", "Mester", "Champ", "Elite"];
const COMPETITIONS = [
  { name: "Norgesmesterskapet 2026", short: "NM 2026" },
  { name: "Freestyle Dance Jam 6", short: "FDJ 6" },
  { name: "Freestyle Dance Jam 7", short: "FDJ 7" },
  { name: "Freestyle Dance Jam 8", short: "FDJ 8" },
  { name: "Dancer of the Year / FDJ 9", short: "DOTY / FDJ 9" },
];
const STYLES = ["Freestyle", "Slow", "Begge"];

function getNeeded(level: number, isFreestyle: boolean) {
  if (level === 0) return 7;
  if (level === 1) return 14;
  if (level === 2) return isFreestyle ? 21 : 28;
  return 0;
}

type Result = { id: string; competition_name: string; dance_style: string; placement: string | null; notes: string | null };
type Child = { id: string; name: string; season_goals: string | null; points_freestyle: number | null; points_slow: number | null; level_freestyle: number | null; level_slow: number | null };

export default function ChildDancerCard({ parentId, children }: { parentId: string; children: Child[] }) {
  const [selectedId, setSelectedId] = useState(children[0]?.id ?? "");
  const child = children.find(c => c.id === selectedId);

  const [goals, setGoals] = useState(child?.season_goals ?? "");
  const [freestyle, setFreestyle] = useState(child?.points_freestyle ?? 0);
  const [slow, setSlow] = useState(child?.points_slow ?? 0);
  const [levelF, setLevelF] = useState(child?.level_freestyle ?? 0);
  const [levelS, setLevelS] = useState(child?.level_slow ?? 0);
  const [results, setResults] = useState<Result[]>([]);
  const [resultsLoaded, setResultsLoaded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [comp, setComp] = useState(COMPETITIONS[0].name);
  const [style, setStyle] = useState(STYLES[0]);
  const [placement, setPlacement] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

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
    const needed = getNeeded(levelF, true);
    if (levelF < 3 && val >= needed) { setLevelF(l => Math.min(l + 1, 4)); setFreestyle(0); }
    else setFreestyle(val);
  }

  function handleSlowChange(val: number) {
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

  async function handleAddResult() {
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("competition_results")
      .insert({ user_id: parentId, child_id: selectedId, competition_name: comp, dance_style: style, placement: placement || null, notes: notes || null })
      .select().single();
    if (!error && data) {
      setResults(r => [data, ...r]);
      setPlacement(""); setNotes(""); setAdding(false);
    }
    setSaving(false);
  }

  async function handleDeleteResult(id: string) {
    const supabase = createClient();
    await supabase.from("competition_results").delete().eq("id", id);
    setResults(r => r.filter(x => x.id !== id));
  }

  if (children.length === 0) return null;

  const neededF = getNeeded(levelF, true);
  const percentF = neededF > 0 ? Math.round((Math.min(freestyle, neededF) / neededF) * 100) : 100;
  const neededS = getNeeded(levelS, false);
  const percentS = neededS > 0 ? Math.round((Math.min(slow, neededS) / neededS) * 100) : 100;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Mine dansere</h2>

      {/* Velg barn */}
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map(c => (
            <button key={c.id} onClick={() => loadChild(c.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedId === c.id ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200 hover:border-purple-400"}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      {children.length === 1 && <p className="text-base font-semibold text-gray-700">{children[0].name}</p>}

      {/* Sesongmål */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target size={16} className="text-purple-500" /> Sesongmål
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400 mb-2">F.eks. triks, mål for konkurranser, hva danseren vil jobbe med</p>
          <textarea value={goals} onChange={e => setGoals(e.target.value)} rows={4}
            placeholder="Skriv mål for sesongen her..."
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </CardContent>
      </Card>

      {/* Poeng og nivåer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy size={16} className="text-purple-500" /> Poeng og nivåer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { label: "Freestyle", points: freestyle, level: levelF, percent: percentF, needed: neededF, onChange: handleFreestyleChange },
            { label: "Slow", points: slow, level: levelS, percent: percentS, needed: neededS, onChange: handleSlowChange },
          ].map(({ label, points, level, percent, needed, onChange }, idx) => (
            <div key={label} className={idx > 0 ? "border-t pt-6" : ""}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">{label}</p>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{LEVELS[level]}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] px-0.5">
                    {LEVELS.map((name, i) => <span key={i} className={i <= level ? "text-purple-600 font-semibold" : "text-gray-400"}>{name}</span>)}
                  </div>
                  <div style={{ height: "12px", backgroundColor: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", backgroundColor: "#7c3aed", borderRadius: "9999px", width: `${Math.max(3, (level / 4) * 100 + (percent / 100) * (100 / 4))}%`, transition: "width 0.5s ease" }} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" min={0} value={points}
                    onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 text-center border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  <p className="text-xs text-gray-500">poeng dette nivået</p>
                </div>
                {level >= 3 ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    <Trophy size={14} className="text-yellow-500" /> Neste nivå avgjøres av plasseringer på stevner
                  </div>
                ) : (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{Math.min(points, needed)} / {needed} poeng mot {LEVELS[level + 1]}</span>
                    <span>{percent}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Konkurranseresultater */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Medal size={16} className="text-purple-500" /> Konkurranseresultater
            </CardTitle>
            <button onClick={() => setAdding(a => !a)} className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium">
              <Plus size={14} /> Legg til
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {adding && (
            <div className="border border-purple-200 rounded-xl p-4 space-y-3 bg-purple-50">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Konkurranse</label>
                <select value={comp} onChange={e => setComp(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400">
                  {COMPETITIONS.map(c => <option key={c.name} value={c.name}>{c.short}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Dansestil</label>
                  <select value={style} onChange={e => setStyle(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400">
                    {STYLES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Plassering</label>
                  <input type="text" value={placement} onChange={e => setPlacement(e.target.value)} placeholder="f.eks. 1, finalist"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Notater (valgfritt)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Hvordan gikk det? Hva lærte du?"
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddResult} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg py-2">
                  {saving ? "Lagrer..." : "Lagre resultat"}
                </button>
                <button onClick={() => setAdding(false)} className="px-4 text-sm text-gray-500 hover:text-gray-700 border rounded-lg">Avbryt</button>
              </div>
            </div>
          )}
          {results.length === 0 && !adding ? (
            <p className="text-sm text-gray-400 text-center py-4">Ingen resultater ennå.</p>
          ) : (
            <div className="space-y-2">
              {results.map(r => (
                <div key={r.id} className="flex items-start justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-700">{COMPETITIONS.find(c => c.name === r.competition_name)?.short ?? r.competition_name}</span>
                      <span className="text-xs text-gray-400">{r.dance_style}</span>
                      {r.placement && (
                        <span className={`text-sm font-bold ${r.placement === "1" ? "text-yellow-500" : r.placement === "2" ? "text-gray-400" : r.placement === "3" ? "text-amber-600" : "text-purple-600"}`}>
                          {r.placement === "1" ? "🥇 1. plass" : r.placement === "2" ? "🥈 2. plass" : r.placement === "3" ? "🥉 3. plass" : r.placement}
                        </span>
                      )}
                    </div>
                    {r.notes && <p className="text-xs text-gray-400 mt-1">{r.notes}</p>}
                  </div>
                  <button onClick={() => handleDeleteResult(r.id)} className="ml-3 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-xl p-3">
          <Check size={16} /> Lagret!
        </div>
      )}
      <Button onClick={handleSave} className="w-full bg-purple-600 hover:bg-purple-700" disabled={saving || success}>
        {saving ? "Lagrer..." : "Lagre"}
      </Button>
    </div>
  );
}
