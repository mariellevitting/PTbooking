"use client";

import { useState } from "react";
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

const STYLES = ["Freestyle", "Slow", "Begge"];

type Result = {
  id: string;
  competition_name: string;
  dance_style: string;
  placement: string | null;
  notes: string | null;
};

interface Props {
  userId: string;
  initialResults: Result[];
}

export default function CompetitionResultsCard({ userId, initialResults }: Props) {
  const [results, setResults] = useState<Result[]>(initialResults);
  const [adding, setAdding] = useState(false);
  const [comp, setComp] = useState(COMPETITIONS[0].name);
  const [style, setStyle] = useState(STYLES[0]);
  const [placement, setPlacement] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleAdd() {
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("competition_results")
      .insert({ user_id: userId, competition_name: comp, dance_style: style, placement: placement || null, notes: notes || null })
      .select()
      .single();
    if (!error && data) {
      setResults(r => [data, ...r]);
      setPlacement("");
      setNotes("");
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

  const placementColor = (p: string | null) => {
    if (p === "1") return "text-yellow-500";
    if (p === "2") return "text-gray-400";
    if (p === "3") return "text-amber-600";
    return "text-purple-600";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Medal size={16} className="text-purple-500" /> Konkurranseresultater
          </CardTitle>
          <button
            onClick={() => setAdding(a => !a)}
            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
          >
            <Plus size={14} /> Legg til
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Skjema for nytt resultat */}
        {adding && (
          <div className="border border-purple-200 rounded-xl p-4 space-y-3 bg-purple-50">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Konkurranse</label>
              <select
                value={comp}
                onChange={e => setComp(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              >
                {COMPETITIONS.map(c => (
                  <option key={c.name} value={c.name}>{c.short}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Dansestil</label>
                <select
                  value={style}
                  onChange={e => setStyle(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                >
                  {STYLES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Plassering</label>
                <input
                  type="text"
                  value={placement}
                  onChange={e => setPlacement(e.target.value)}
                  placeholder="f.eks. 1, finalist"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Notater (valgfritt)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Hvordan gikk det? Hva lærte du?"
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg py-2 transition-colors"
              >
                {saving ? "Lagrer..." : "Lagre resultat"}
              </button>
              <button
                onClick={() => setAdding(false)}
                className="px-4 text-sm text-gray-500 hover:text-gray-700 border rounded-lg"
              >
                Avbryt
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-xl p-3">
            <Check size={16} /> Resultat lagret!
          </div>
        )}

        {/* Liste over resultater */}
        {results.length === 0 && !adding ? (
          <p className="text-sm text-gray-400 text-center py-4">Ingen resultater ennå. Trykk "Legg til" for å logge ditt første resultat!</p>
        ) : (
          <div className="space-y-2">
            {results.map(r => (
              <div key={r.id} className="flex items-start justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700">
                      {COMPETITIONS.find(c => c.name === r.competition_name)?.short ?? r.competition_name}
                    </span>
                    <span className="text-xs text-gray-400">{r.dance_style}</span>
                    {r.placement && (
                      <span className={`text-sm font-bold ${placementColor(r.placement)}`}>
                        {r.placement === "1" ? "🥇 1. plass" : r.placement === "2" ? "🥈 2. plass" : r.placement === "3" ? "🥉 3. plass" : r.placement}
                      </span>
                    )}
                  </div>
                  {r.notes && <p className="text-xs text-gray-400 mt-1">{r.notes}</p>}
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="ml-3 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                >
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
