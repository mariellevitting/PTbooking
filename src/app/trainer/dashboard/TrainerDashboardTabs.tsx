"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime, formatDateKey } from "@/lib/dateUtils";

interface Booking {
  id: string;
  dancer_name: string;
  dance_style: string;
  status: string;
  profiles?: { avatar_url?: string } | null;
}

interface Slot {
  id: string;
  start_at: string;
  end_at: string;
  is_booked: boolean;
  bookings?: Booking[];
}

interface CompletedSlot {
  id: string;
  start_at: string;
  end_at: string;
  bookings?: { dancer_name: string; dance_style: string; status: string }[];
}

interface Props {
  slots: Slot[];
  completedSlots: CompletedSlot[];
}

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function TrainerDashboardTabs({ slots, completedSlots }: Props) {
  const [tab, setTab] = useState<"upcoming" | "completed">("upcoming");

  const completed = completedSlots.filter(slot =>
    slot.bookings?.some(b => b.status === "confirmed")
  );

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-3">
        <button
          onClick={() => setTab("upcoming")}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "upcoming" ? "bg-white dark:bg-gray-900 text-[#c87de0] shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          Kommende
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "completed" ? "bg-white dark:bg-gray-900 text-[#c87de0] shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          Gjennomførte
        </button>
      </div>

      {/* Legg ut tid-knapp */}
      <Link href="/trainer/availability" className="block mb-4">
        <Button className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a]">+ Legg ut tid</Button>
      </Link>

      {/* Kommende timer */}
      {tab === "upcoming" && (() => {
        if (!slots || slots.length === 0) {
          return (
            <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5 text-center text-gray-400 dark:text-gray-500">
              <p className="font-medium">Ingen tider lagt ut</p>
              <p className="text-sm mt-1">Legg ut ledige tider så dansere kan booke deg</p>
            </div>
          );
        }

        const grouped: Record<string, typeof slots> = {};
        for (const slot of slots) {
          const key = formatDateKey(new Date(slot.start_at));
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(slot);
        }
        const weekGroups: Record<number, string[]> = {};
        for (const dateKey of Object.keys(grouped).sort()) {
          const week = getWeekNumber(new Date(dateKey));
          if (!weekGroups[week]) weekGroups[week] = [];
          weekGroups[week].push(dateKey);
        }

        return (
          <div className="space-y-6">
            {Object.entries(weekGroups).map(([week, dateKeys]) => (
              <div key={week}>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Uke {week}</p>
                <div className="space-y-4">
                  {dateKeys.sort().map((dateKey) => {
                    const daySlots = grouped[dateKey];
                    const dayLabel = formatDate(new Date(dateKey), { weekday: "long", day: "numeric", month: "long" });
                    return (
                      <div key={dateKey}>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 border-b dark:border-gray-700 pb-1">
                          {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
                        </p>
                        <div className="space-y-2">
                          {daySlots.map((slot) => {
                            const start = new Date(slot.start_at);
                            const end = new Date(slot.end_at);
                            const booking = slot.bookings?.find(b => b.status === "confirmed");
                            return (
                              <div key={slot.id} className={`rounded-xl border p-4 flex justify-between items-center ${booking ? "bg-white dark:bg-gray-900 border-l-4 border-l-[#E2A9F1]" : "bg-gray-50 dark:bg-gray-950 border-dashed border-gray-200 dark:border-gray-700"}`}>
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatTime(start)}–{formatTime(end)}</p>
                                  {booking && (
                                    <>
                                      <div className="flex items-center gap-2 mt-1">
                                        {(booking.profiles as any)?.avatar_url ? (
                                          <img src={(booking.profiles as any).avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                                        ) : (
                                          <div className="w-6 h-6 rounded-full bg-[#edd5f9] flex items-center justify-center text-[#E2A9F1] text-xs font-bold">
                                            {booking.dancer_name.charAt(0)}
                                          </div>
                                        )}
                                        <p className="text-sm font-medium text-[#c87de0]">{booking.dancer_name} · {booking.dance_style}</p>
                                      </div>
                                      {end > new Date() && (
                                        <Link href={`/trainer/avbestill/${booking.id}`} className="text-xs text-red-400 hover:text-red-600 mt-1 inline-block">Avbestill</Link>
                                      )}
                                    </>
                                  )}
                                </div>
                                {booking ? (
                                  <span className="text-xs bg-[#edd5f9] text-[#c87de0] px-2 py-1 rounded-full whitespace-nowrap">Opptatt</span>
                                ) : (
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Ledig</span>
                                    <Link href={`/trainer/slett-slot/${slot.id}`} className="text-xs text-red-400 hover:text-red-600">Slett</Link>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Gjennomførte timer */}
      {tab === "completed" && (() => {
        if (completed.length === 0) {
          return (
            <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5 text-center text-gray-400 dark:text-gray-500">
              <p className="font-medium">Ingen gjennomførte timer ennå</p>
            </div>
          );
        }

        const monthGroups: Record<string, typeof completed> = {};
        for (const slot of completed) {
          const d = new Date(slot.start_at);
          const key = formatDate(d, { month: "long", year: "numeric" });
          if (!monthGroups[key]) monthGroups[key] = [];
          monthGroups[key].push(slot);
        }

        return (
          <div className="space-y-6">
            <p className="text-xs text-[#E2A9F1]">{completed.length} gjennomførte privattimer totalt</p>
            {Object.entries(monthGroups).map(([month, monthSlots]) => (
              <div key={month}>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{month}</p>
                <div className="space-y-2">
                  {monthSlots.map((slot) => {
                    const start = new Date(slot.start_at);
                    const end = new Date(slot.end_at);
                    const booking = slot.bookings?.find(b => b.status === "confirmed");
                    const dayLabel = formatDate(start, { weekday: "long", day: "numeric", month: "long" });
                    return (
                      <div key={slot.id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4 opacity-80">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">{formatTime(start)}–{formatTime(end)}</p>
                            {booking && <p className="text-sm text-[#E2A9F1] mt-0.5">{booking.dancer_name} · {booking.dance_style}</p>}
                          </div>
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full">Fullført</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
