"use client";

import { useEffect, useState } from "react";

const NM_DATE = new Date("2026-06-13T00:00:00");

function getTimeLeft() {
  const now = new Date();
  const diff = NM_DATE.getTime() - now.getTime();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

export default function NMCountdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-4 mb-6 text-white">
      <p className="text-xs font-semibold uppercase tracking-wider text-purple-200 mb-2">🏆 Norgesmesterskapet 2026</p>
      <p className="text-sm text-purple-100 mb-3">13–14. juni · NM nedtelling</p>
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
  );
}
