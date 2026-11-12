"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateKey, formatDate } from "@/lib/dateUtils";

interface Room {
  id: string;
  name: string;
}

interface SlotRow {
  id: string;
  start_at: string;
  is_booked: boolean;
}

function timesForDay() {
  const times: string[] = [];
  for (let h = 9; h < 21; h++) {
    for (const m of [0, 30]) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return times;
}

function nextDays(n: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

export default function TrainerRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [slotsByTime, setSlotsByTime] = useState<Map<string, SlotRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busyTime, setBusyTime] = useState<string | null>(null);
  const [error, setError] = useState("");

  const days = nextDays(14);
  const times = timesForDay();

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("club_id").eq("id", user.id).single();
      const clubId = (profile as any)?.club_id;
      if (!clubId) { setLoading(false); return; }
      const { data: roomRows } = await supabase
        .from("rooms")
        .select("id, name")
        .eq("club_id", clubId)
        .order("sort_order");
      setRooms(roomRows ?? []);
      setActiveRoom(roomRows?.[0]?.id ?? null);
      setLoading(false);
    }
    init();
  }, []);

  const fetchSlots = useCallback(async (roomId: string, date: Date) => {
    const supabase = createClient();
    const dateStr = formatDateKey(date);
    const dayStart = new Date(`${dateStr}T00:00:00`).toISOString();
    const dayEnd = new Date(`${dateStr}T23:59:59`).toISOString();
    const { data } = await supabase
      .from("room_slots")
      .select("id, start_at, is_booked")
      .eq("room_id", roomId)
      .gte("start_at", dayStart)
      .lte("start_at", dayEnd);
    const map = new Map<string, SlotRow>();
    (data ?? []).forEach(s => {
      const d = new Date(s.start_at);
      const key = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      map.set(key, s as SlotRow);
    });
    setSlotsByTime(map);
  }, []);

  useEffect(() => {
    if (activeRoom) fetchSlots(activeRoom, selectedDate);
  }, [activeRoom, selectedDate, fetchSlots]);

  async function toggleTime(time: string) {
    if (!activeRoom || busyTime) return;
    setError("");
    const existing = slotsByTime.get(time);
    if (existing?.is_booked) return; // kan ikke fjerne en booket time

    setBusyTime(time);
    const supabase = createClient();

    if (existing) {
      const { error } = await supabase.from("room_slots").delete().eq("id", existing.id);
      if (error) setError(error.message);
    } else {
      const dateStr = formatDateKey(selectedDate);
      const [h, m] = time.split(":").map(Number);
      const start = new Date(`${dateStr}T00:00:00`);
      start.setHours(h, m, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);
      const { error } = await supabase.from("room_slots").insert({
        room_id: activeRoom,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      });
      if (error) setError(error.message);
    }
    await fetchSlots(activeRoom, selectedDate);
    setBusyTime(null);
  }

  if (loading) {
    return <main className="max-w-lg mx-auto px-6 py-8 text-gray-400 text-sm">Laster…</main>;
  }

  if (rooms.length === 0) {
    return (
      <main className="max-w-lg mx-auto px-6 py-8">
        <p className="text-gray-400 text-sm">Klubben din har ingen saler satt opp ennå.</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-6 py-8">
      <h1 className="font-display text-2xl mb-1">Saler – egentrening</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Legg ut eller fjern ledige 30-minuttersblokker. Dansere og foreldre booker gratis.
      </p>

      {/* Sal-faner */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
        {rooms.map(r => (
          <button
            key={r.id}
            onClick={() => setActiveRoom(r.id)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeRoom === r.id
                ? "bg-white dark:bg-gray-900 text-[#c87de0] shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Dag-velger */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
        {days.map(d => {
          const active = formatDateKey(d) === formatDateKey(selectedDate);
          return (
            <button
              key={formatDateKey(d)}
              onClick={() => setSelectedDate(d)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                active
                  ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A] dark:bg-[#c87de0] dark:text-white dark:border-[#c87de0]"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
              }`}
            >
              {formatDate(d, { weekday: "short", day: "numeric", month: "short" })}
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-4 gap-2">
            {times.map(time => {
              const slot = slotsByTime.get(time);
              const state = slot?.is_booked ? "booked" : slot ? "open" : "none";
              return (
                <button
                  key={time}
                  onClick={() => toggleTime(time)}
                  disabled={busyTime === time || state === "booked"}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-60 ${
                    state === "booked"
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                      : state === "open"
                      ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A] dark:bg-[#c87de0] dark:text-white dark:border-[#c87de0]"
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#3A3A3A] dark:bg-[#c87de0] inline-block" /> Ledig</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700 inline-block" /> Booket</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-gray-300 dark:border-gray-700 inline-block" /> Ikke lagt ut</span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
