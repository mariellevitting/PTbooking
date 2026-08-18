"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";

export const COMPETITIONS = [
  { short: "NM", name: "Norgesmesterskapet 2026", date: new Date("2026-06-13T00:00:00"), dateLabel: "13–14. juni", location: "Sofiemyrhallen, Sofienmyr" },
  { short: "FDJ 6", name: "Freestyle Dance Jam 6", date: new Date("2026-08-22T00:00:00"), dateLabel: "22. august", location: "Gausdal Arena, Lillehammer" },
  { short: "FDJ 7", name: "Freestyle Dance Jam 7", date: new Date("2026-09-19T00:00:00"), dateLabel: "19. september", location: null },
  { short: "FDJ 8", name: "Freestyle Dance Jam 8", date: new Date("2026-10-17T00:00:00"), dateLabel: "17. oktober", location: "Fjellhamar Arena, Lørenskog" },
  { short: "DOTY / FDJ 9", name: "Dancer of the Year / FDJ 9", date: new Date("2026-11-21T00:00:00"), dateLabel: "21. november", location: null },
];

function daysUntil(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface Props {
  userId: string;
  showCountdown?: boolean; // show the big "next competition" card
}

export default function CompetitionList({ userId, showCountdown = false }: Props) {
  const upcoming = COMPETITIONS.filter(c => daysUntil(c.date) > 0);
  const next = upcoming[0];
  const rest = upcoming.slice(1);

  const [participating, setParticipating] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const supabase = createClient();

    const fetchCounts = async () => {
      const { data } = await supabase.from("competition_participations").select("competition_name");
      if (!data) return;
      const c: Record<string, number> = {};
      for (const r of data) c[r.competition_name] = (c[r.competition_name] ?? 0) + 1;
      setCounts(c);
    };

    supabase
      .from("competition_participations")
      .select("competition_name")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (data) setParticipating(new Set(data.map(r => r.competition_name)));
      });

    fetchCounts();

    const channel = supabase
      .channel("competition_participations_list")
      .on("postgres_changes", { event: "*", schema: "public", table: "competition_participations" }, fetchCounts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  async function toggle(name: string) {
    if (toggling) return;
    setToggling(name);
    const supabase = createClient();
    const isOn = participating.has(name);
    if (isOn) {
      await supabase.from("competition_participations").delete().eq("user_id", userId).eq("competition_name", name);
      setParticipating(prev => { const s = new Set(prev); s.delete(name); return s; });
      setCounts(prev => ({ ...prev, [name]: Math.max(0, (prev[name] ?? 1) - 1) }));
    } else {
      await supabase.from("competition_participations").insert({ user_id: userId, competition_name: name });
      setParticipating(prev => new Set(prev).add(name));
      setCounts(prev => ({ ...prev, [name]: (prev[name] ?? 0) + 1 }));
    }
    setToggling(null);
  }

  if (upcoming.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">Ingen kommende konkurranser</p>;
  }

  return (
    <div className="space-y-3">
      {showCountdown && next && (
        <div className="bg-[#3A3A3A] rounded-2xl px-5 py-4">
          <p className="text-xs text-[#e8c4f5] font-semibold uppercase tracking-wide mb-1">🏆 Neste konkurranse</p>
          <p className="text-lg font-bold text-white">{next.short}</p>
          <p className="text-sm text-[#e8c4f5] mt-0.5">{next.dateLabel}{next.location ? ` · ${next.location}` : ""}</p>
          <div className="mt-3 flex items-end justify-between">
            <div className="flex items-end gap-1">
              <p className="text-4xl font-bold text-white">{daysUntil(next.date)}</p>
              <p className="text-sm text-[#e8c4f5] mb-1">dager igjen</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {(counts[next.name] ?? 0) > 0 && (
                <p className="text-xs text-[#e8c4f5]">{counts[next.name]} stk skal delta</p>
              )}
              <DeltaButton name={next.name} participating={participating} toggling={toggling} onToggle={toggle} variant="dark" />
            </div>
          </div>
        </div>
      )}

      {(!showCountdown ? upcoming : rest).map(c => {
        const days = daysUntil(c.date);
        const isOn = participating.has(c.name);
        return (
          <div key={c.name} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 dark:text-white">{c.short}</p>
              <p className="text-sm text-[#E2A9F1]">{c.dateLabel}</p>
              {c.location && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{c.location}</p>}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {(counts[c.name] ?? 0) > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">{counts[c.name]} stk skal delta</p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#E2A9F1] bg-[#f5eeff] dark:bg-[#E2A9F1]/10 px-2 py-1 rounded-full whitespace-nowrap">
                  {days} dager
                </span>
                <DeltaButton name={c.name} participating={participating} toggling={toggling} onToggle={toggle} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DeltaButton({ name, participating, toggling, onToggle, variant = "light" }: {
  name: string;
  participating: Set<string>;
  toggling: string | null;
  onToggle: (name: string) => void;
  variant?: "light" | "dark";
}) {
  const isOn = participating.has(name);
  const isLoading = toggling === name;

  if (variant === "dark") {
    return (
      <button
        onClick={() => onToggle(name)}
        disabled={!!toggling}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          isOn
            ? "bg-[#E2A9F1] text-[#3A3A3A]"
            : "bg-white/15 text-white hover:bg-white/25"
        }`}
      >
        {isOn && <Check size={12} strokeWidth={3} />}
        {isLoading ? "..." : isOn ? "Deltar" : "Delta"}
      </button>
    );
  }

  return (
    <button
      onClick={() => onToggle(name)}
      disabled={!!toggling}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
        isOn
          ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A]"
          : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#E2A9F1]"
      }`}
    >
      {isOn && <Check size={12} strokeWidth={3} />}
      {isLoading ? "..." : isOn ? "Deltar" : "Delta"}
    </button>
  );
}
