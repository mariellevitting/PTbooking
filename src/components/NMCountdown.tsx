"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
  };
}

interface Props {
  href?: string;
}

export default function NMCountdown({ href }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const upcoming = COMPETITIONS.filter(c => getTimeLeft(c.date) !== null);
  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const timeLeft = getTimeLeft(next.date)!;

  const box = (
    <div className="bg-purple-600 rounded-xl px-4 py-3 flex items-center justify-between">
      <div>
        <p className="text-xs text-purple-200 font-semibold uppercase tracking-wide">Neste konkurranse</p>
        <p className="text-sm font-bold text-white">{next.name}</p>
        <p className="text-xs text-purple-200">{next.dateLabel}{next.location ? ` · ${next.location}` : ""}</p>
      </div>
      <div className="text-right ml-4">
        <p className="text-3xl font-bold text-white">{timeLeft.days}</p>
        <p className="text-xs text-purple-200">dager igjen</p>
      </div>
    </div>
  );

  return (
    <div className="mb-6">
      {href ? <Link href={href}>{box}</Link> : box}
    </div>
  );
}
