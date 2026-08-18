"use client";

import { useEffect, useState } from "react";
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
}

export default function NMCountdown({ href }: Props) {
  const [tick, setTick] = useState(0);
  const [count, setCount] = useState<number | null>(null);

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
      const { count: c } = await supabase
        .from("competition_participations")
        .select("id", { count: "exact", head: true })
        .eq("competition_name", competitionName);
      setCount(c ?? 0);
    };

    fetchCount();

    const channel = supabase
      .channel("competition_participations_count")
      .on("postgres_changes", { event: "*", schema: "public", table: "competition_participations" }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [next?.name]);

  if (upcoming.length === 0) return null;
  const timeLeft = getTimeLeft(next.date)!;

  const box = (
    <div className="bg-[#3A3A3A] rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-xs text-[#e8c4f5] font-semibold uppercase tracking-wide">Neste konkurranse</p>
        <p className="text-sm font-bold text-white">{next.short}</p>
        <p className="text-xs text-[#e8c4f5]">{next.dateLabel}{next.location ? ` · ${next.location}` : ""}</p>
        {count !== null && count > 0 && (
          <p className="text-xs text-[#e8c4f5] mt-1">{count} stk skal delta</p>
        )}
      </div>
      <div className="text-right ml-4">
        <p className="text-3xl font-bold text-white">{timeLeft.days}</p>
        <p className="text-xs text-[#e8c4f5]">dager igjen</p>
      </div>
    </div>
  );

  return (
    <div className="mb-6">
      {href ? <Link href={href}>{box}</Link> : box}
    </div>
  );
}
