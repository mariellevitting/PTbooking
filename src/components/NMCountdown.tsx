"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const COMPETITIONS = [
  {
    name: "Norgesmesterskapet 2026",
    short: "NM",
    date: new Date("2026-06-13T00:00:00"),
    dateLabel: "13–14. juni",
    location: "Sofiemyrhallen, Sofienmyr",
  },
  {
    name: "Freestyle Dance Jam 6",
    short: "FDJ 6",
    date: new Date("2026-08-22T00:00:00"),
    dateLabel: "22. august",
    location: "Gausdal Arena, Lillehammer",
  },
  {
    name: "Freestyle Dance Jam 7",
    short: "FDJ 7",
    date: new Date("2026-09-19T00:00:00"),
    dateLabel: "19. september",
    location: null,
  },
  {
    name: "Freestyle Dance Jam 8",
    short: "FDJ 8",
    date: new Date("2026-10-17T00:00:00"),
    dateLabel: "17. oktober",
    location: "Fjellhamar Arena, Lørenskog",
  },
  {
    name: "Dancer of the Year / FDJ 9",
    short: "DOTY / FDJ 9",
    date: new Date("2026-11-21T00:00:00"),
    dateLabel: "21. november",
    location: null,
  },
];

function getTimeLeft(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = date.getTime() - today.getTime();
  if (diff <= 0) return null;
  return {
    days: Math.round(diff / (1000 * 60 * 60 * 24)),
  };
}

interface Props {
  href?: string;
  clubId?: string | null;
}

export default function NMCountdown({ href, clubId }: Props) {
  const instanceId = useId();
  const [tick, setTick] = useState(0);
  const [participants, setParticipants] = useState<{ name: string; avatar_url: string | null }[]>([]);

  const upcoming = COMPETITIONS.filter(c => getTimeLeft(c.date) !== null);
  const next = upcoming[0];

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!next) return;
    const supabase = createClient();
    const competitionName = next.name;

    const fetchCount = async () => {
      let q = supabase
        .from("competition_participations")
        .select("profiles!inner(name, avatar_url, club_id)")
        .eq("competition_name", competitionName);
      if (clubId) q = q.eq("profiles.club_id", clubId);
      const { data } = await q;
      setParticipants((data ?? []).map((r: any) => ({ name: r.profiles?.name ?? "", avatar_url: r.profiles?.avatar_url ?? null })));
    };

    fetchCount();

    const channel = supabase
      .channel(`nm_count_${instanceId}_${competitionName}`.replace(/\s/g, "_"))
      .on("postgres_changes", { event: "*", schema: "public", table: "competition_participations" }, () => setTimeout(fetchCount, 300))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [next?.name, clubId]);

  if (upcoming.length === 0) return null;
  const timeLeft = getTimeLeft(next.date)!;

  const shownAvatars = participants.slice(0, 3);
  const extra = participants.length - shownAvatars.length;
  const AVATAR_BG = ["bg-[#edd5f9] text-[#9b59c4]", "bg-[#f4c0d1] text-[#72243E]", "bg-[#cfe0fb] text-[#0C447C]"];

  const box = (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full py-2 pl-2 pr-3 flex items-center gap-3 shadow-sm">
      <div className="w-14 h-14 rounded-full bg-[#3A3A3A] flex flex-col items-center justify-center shrink-0">
        <p className="text-xl font-semibold leading-none text-[#E2A9F1]">{timeLeft.days}</p>
        <p className="text-[10px] text-[#d9c3e3]">{timeLeft.days === 1 ? "dag" : "dager"}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white truncate">{next.short}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{next.dateLabel}</p>
      </div>
      {participants.length > 0 && (
        <div className="flex items-center shrink-0" aria-label={`${participants.length} skal delta`}>
          {shownAvatars.map((p, i) => (
            p.avatar_url ? (
              <img key={i} src={p.avatar_url} alt={p.name} className={`w-7 h-7 rounded-full object-cover border-2 border-white dark:border-gray-900 ${i > 0 ? "-ml-2" : ""}`} />
            ) : (
              <span key={i} className={`w-7 h-7 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-semibold ${AVATAR_BG[i % 3]} ${i > 0 ? "-ml-2" : ""}`}>
                {p.name.charAt(0)}
              </span>
            )
          ))}
          {extra > 0 && (
            <span className="h-7 px-2 -ml-2 rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 flex items-center">+{extra}</span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="mb-6">
      {href ? <Link href={href}>{box}</Link> : box}
    </div>
  );
}
