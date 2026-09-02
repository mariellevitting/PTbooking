"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Medal, Plus, Trash2, Check } from "lucide-react";

const COMPETITIONS = [
  { name: "Norgesmesterskapet 2026", short: "NM 2026" },
  { name: "Freestyle Dance Jam 6", short: "FDJ 6" },
  { name: "Freestyle Dance Jam 7", short: "FDJ 7" },
  { name: "Freestyle Dance Jam 8", short: "FDJ 8" },
  { name: "Dancer of the Year / FDJ 9", short: "DOTY / FDJ 9" },
];

function placementLabel(p: string | null) {
  if (!p) return null;
  if (p === "1") return "🥇 1. plass";
  if (p === "2") return "🥈 2. plass";
  if (p === "3") return "🥉 3. plass";
  return p;
}

function placementColor(p: string | null) {
  if (p === "1") return "text-yellow-500";
  if (p === "2") return "text-gray-400";
  if (p === "3") return "text-amber-600";
  return "text-[#E2A9F1]";
}

type Result = {
  id: string;
  competition_name: string;
  placement_freestyle: string | null;
  placement_slow: string | null;
  notes: string | null;
};

interface Props {
  userId: string;
  initialResults: Result[];
  childId?: string;
}

export default function CompetitionResultsCard({ userId, initialResults, childId }: Props) {
  const [results, setResults] = useState<Result[]>(initialResults);

  useEffect(() => {
    setResults(initialResults);
  }, [initialResults]);
  const [adding, setAdding] = useState(false);
  const [comp, setComp] = useState(COMPETITIONS[0].name);
  const [placementF, setPlacementF] = useState("");
  const [placementS, setPlacementS] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleAdd() {
    if (!placementF && !placementS) return;
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("competition_results")
      .insert({
        user_id: userId,
        ...(childId ? { child_id: childId } : {}),
        competition_name: comp,
        dance_style: placementF && placementS ? "Begge" : placementF ? "Freestyle" : "Slow",
        placement_freestyle: placementF || null,
        placement_slow: placementS || null,
        notes: notes || null,
      })
      .select()
      .single();
    if (error) {
      setSaveError("Kunne ikke lagre: " + error.message);
    } else if (data) {
      setResults(r => [data, ...r]);
      setPlacementF(""); setPlacementS(""); setNotes("");
      setAdding(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("competition_results").delete().eq("id", id);
    setResults(r => r.filter(x => x.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Medal size={16} className="text-[#E2A9F1]" /> Konkurranseresultater
          </CardTitle>
          <button onClick={() => setAdding(a => !a)} className="flex items-center gap-1 text-xs text-[#E2A9F1] hover:text-purple-800 font-medium">
            <Plus size={14} /> Legg til
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {adding && (
          <div className="border border-[#E2A9F1]/40 rounded-xl p-4 space-y-3 bg-[#f5eeff] dark:bg-[#E2A9F1]/10">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Konkurranse</label>
              <select value={comp} onChange={e => setComp(e.target.value)}
                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]">
                {COMPETITIONS.map(c => <option key={c.name} value={c.name}>{c.short}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Freestyle-plassering</label>
                <input type="text" value={placementF} onChange={e => setPlacementF(e.target.value)}
                  placeholder="f.eks. 1, finalist"
                  className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Slow-plassering</label>
                <input type="text" value={placementS} onChange={e => setPlacementS(e.target.value)}
                  placeholder="f.eks. 2, semifinalist"
                  className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={saving || (!placementF && !placementS)}
                className="flex-1 bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2">
                {saving ? "Lagrer..." : "Lagre resultat"}
              </button>
              <button onClick={() => setAdding(false)} className="px-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                Avbryt
              </button>
            </div>
            {saveError && (
              <p className="text-xs text-red-500 mt-1">{saveError}</p>
            )}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-[#c87de0] text-sm bg-[#f5eeff] dark:bg-[#E2A9F1]/10 border border-[#E2A9F1]/40 rounded-xl p-3">
            <Check size={16} /> Resultat lagret!
          </div>
        )}

        {results.length === 0 && !adding ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Ingen resultater ennå. Trykk "Legg til" for å logge ditt første resultat!</p>
        ) : (
          <div className="space-y-2">
            {results.map(r => (
              <div key={r.id} className="flex items-start justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {COMPETITIONS.find(c => c.name === r.competition_name)?.short ?? r.competition_name}
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {r.placement_freestyle && (
                      <span className="text-xs">
                        <span className="text-gray-400 dark:text-gray-300">Freestyle: </span>
                        <span className={`font-bold ${placementColor(r.placement_freestyle)}`}>{placementLabel(r.placement_freestyle)}</span>
                      </span>
                    )}
                    {r.placement_slow && (
                      <span className="text-xs">
                        <span className="text-gray-400 dark:text-gray-300">Slow: </span>
                        <span className={`font-bold ${placementColor(r.placement_slow)}`}>{placementLabel(r.placement_slow)}</span>
                      </span>
                    )}
                  </div>
                  {r.notes && <p className="text-xs text-gray-400 dark:text-gray-300 mt-1">{r.notes}</p>}
                </div>
                <button onClick={() => handleDelete(r.id)} className="ml-3 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
