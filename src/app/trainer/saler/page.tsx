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
  const [existingSlots, setExistingSlots] = useState<Map<string, SlotRow>>(new Map());
  // Valgt, men ikke publisert ennå: dato -> sett av klokkeslett
  const [pending, setPending] = useState<Map<string, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [deletingTime, setDeletingTime] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
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

  const fetchExistingSlots = useCallback(async (roomId: string, date: Date) => {
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
    setExistingSlots(map);
  }, []);

  useEffect(() => {
    if (activeRoom) fetchExistingSlots(activeRoom, selectedDate);
  }, [activeRoom, selectedDate, fetchExistingSlots]);

  function pickRoom(roomId: string) {
    setActiveRoom(roomId);
    setPending(new Map());
    setPublished(false);
  }

  function pickDate(d: Date) {
    setSelectedDate(d);
    setPublished(false);
  }

  function toggleTime(time: string) {
    const existing = existingSlots.get(time);
    if (existing) {
      if (existing.is_booked) return; // kan ikke fjerne en booket time
      removeExisting(existing.id, time);
      return;
    }
    const dateKey = formatDateKey(selectedDate);
    setPending(prev => {
      const next = new Map(prev);
      const daySet = new Set(next.get(dateKey) ?? []);
      daySet.has(time) ? daySet.delete(time) : daySet.add(time);
      if (daySet.size === 0) next.delete(dateKey); else next.set(dateKey, daySet);
      return next;
    });
  }

  async function removeExisting(slotId: string, time: string) {
    if (!activeRoom) return;
    setDeletingTime(time);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.from("room_slots").delete().eq("id", slotId);
    if (error) setError(error.message);
    await fetchExistingSlots(activeRoom, selectedDate);
    setDeletingTime(null);
  }

  const totalPending = Array.from(pending.values()).reduce((sum, s) => sum + s.size, 0);

  async function publishTimes() {
    if (!activeRoom || totalPending === 0) return;
    setPublishing(true);
    setError("");
    const supabase = createClient();

    const rows: { room_id: string; start_at: string; end_at: string }[] = [];
    for (const [dateKey, timeSet] of pending.entries()) {
      for (const time of timeSet) {
        const [h, m] = time.split(":").map(Number);
        const start = new Date(`${dateKey}T00:00:00`);
        start.setHours(h, m, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);
        rows.push({ room_id: activeRoom, start_at: start.toISOString(), end_at: end.toISOString() });
      }
    }

    const { error: insertError } = await supabase.from("room_slots").insert(rows);
    if (insertError) {
      setError(insertError.code === "23505"
        ? "En eller flere av tidene finnes allerede. Oppdater siden og prøv igjen."
        : insertError.message);
      setPublishing(false);
      return;
    }

    // Varsle dansere/foreldre i klubben om at nye saltider er ledige
    const { data: { user } } = await supabase.auth.getUser();
    const { data: trainerProfile } = await supabase.from("profiles").select("name, club_id").eq("id", user?.id ?? "").single();
    const roomName = rooms.find(r => r.id === activeRoom)?.name ?? "Sal";
    const { data: recipients } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["dancer", "parent"])
      .or("notify_new_slots.is.null,notify_new_slots.eq.true")
      .eq("club_id", trainerProfile?.club_id ?? "");

    if (recipients && recipients.length > 0) {
      const message = `${trainerProfile?.name ?? "Treneren"} har lagt ut ${rows.length} ledig${rows.length === 1 ? "" : "e"} tid${rows.length === 1 ? "" : "er"} i ${roomName} til egentrening`;
      await supabase.from("notifications").insert(recipients.map(r => ({ user_id: r.id, message })));
      fetch("/api/notify-new-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: recipients.map(r => r.id), message }),
      }).catch(() => {});
    }

    setPending(new Map());
    setPublishing(false);
    setPublished(true);
    await fetchExistingSlots(activeRoom, selectedDate);
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

  const dateKey = formatDateKey(selectedDate);
  const pendingToday = pending.get(dateKey) ?? new Set<string>();

  return (
    <main className="max-w-lg mx-auto px-6 py-8 pb-28">
      <h1 className="font-display text-2xl mb-1">Saler – egentrening</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Velg ledige 30-minuttersblokker, og publiser dem når du er klar. Dansere og foreldre booker gratis.
      </p>

      {/* Sal-faner */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
        {rooms.map(r => (
          <button
            key={r.id}
            onClick={() => pickRoom(r.id)}
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
          const active = formatDateKey(d) === dateKey;
          const count = pending.get(formatDateKey(d))?.size ?? 0;
          return (
            <button
              key={formatDateKey(d)}
              onClick={() => pickDate(d)}
              className={`relative shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                active
                  ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A] dark:bg-[#c87de0] dark:text-white dark:border-[#c87de0]"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
              }`}
            >
              {formatDate(d, { weekday: "short", day: "numeric", month: "short" })}
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#E2A9F1] text-[#3A3A3A] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      {published && <p className="text-sm text-green-600 dark:text-green-400 mb-3">Tidene er publisert og klare for booking! 🎉</p>}

      <Card>
        <CardContent className="pt-5">
          <div className="grid grid-cols-4 gap-2">
            {times.map(time => {
              const existing = existingSlots.get(time);
              const isPendingHere = pendingToday.has(time);
              const state = existing?.is_booked ? "booked" : existing ? "published" : isPendingHere ? "pending" : "none";
              return (
                <button
                  key={time}
                  onClick={() => toggleTime(time)}
                  disabled={deletingTime === time || state === "booked"}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-60 ${
                    state === "booked"
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                      : state === "published"
                      ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A] dark:bg-[#c87de0] dark:text-white dark:border-[#c87de0]"
                      : state === "pending"
                      ? "bg-white text-[#3A3A3A] border-2 border-dashed border-[#c87de0] dark:bg-gray-900 dark:text-[#E2A9F1]"
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-dashed border-[#c87de0] inline-block" /> Valgt, ikke publisert</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#3A3A3A] dark:bg-[#c87de0] inline-block" /> Publisert, ledig</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700 inline-block" /> Booket</span>
          </div>
        </CardContent>
      </Card>

      {totalPending > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-700 p-4 z-40">
          <div className="max-w-lg mx-auto">
            <Button
              onClick={publishTimes}
              disabled={publishing}
              className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white"
            >
              {publishing ? "Publiserer…" : `Publiser tider for egentrening (${totalPending})`}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
