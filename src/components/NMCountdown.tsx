"use client";

import { useEffect, useState } from "react";

const COMPETITIONS = [
  {
    name: "Norgesmesterskapet 2026",
    short: "NM",
    date: new Date("2026-06-13T00:00:00"),
    dateLabel: "13–14. juni",
    location: null,
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
];

function getTimeLeft(date: Date) {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export default function NMCountdown() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const upcoming = COMPETITIONS.filter(c => getTimeLeft(c.date) !== null);
  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const timeLeft = getTimeLeft(next.date)!;

  return (
    <div className="mb-6 space-y-2">
      {/* Neste konkurranse – stor nedtelling */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-200 mb-1">🏆 {next.short}</p>
        <p className="text-sm font-semibold text-white">{next.name}</p>
        <p className="text-xs text-purple-200 mb-3">
          {next.dateLabel}{next.location ? ` · ${next.location}` : " · Lokasjon ikke avklart"}
        </p>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { value: timeLeft.days, label: "Dager" },
            { value: timeLeft.hours, label: "Timer" },
            { value: timeLeft.minutes, label: "Min" },
            { value: timeLeft.seconds, label: "Sek" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white/20 rounded-xl py-2">
              <p className="text-2xl font-bold">{String(value).padStart(2, "0")}</p>
              <p className="text-xs text-purple-200">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Kommende konkurranser */}
      {upcoming.slice(1).map((comp) => (
        <div key={comp.name} className="bg-white border border-purple-100 rounded-xl px-4 py-3 flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-gray-700">{comp.short} – {comp.dateLabel}</p>
            <p className="text-xs text-gray-400">{comp.location ?? "Lokasjon ikke avklart"}</p>
          </div>
          <span className="text-xs text-purple-500 font-medium">
            {getTimeLeft(comp.date)!.days} dager
          </span>
        </div>
      ))}
    </div>
  );
}
