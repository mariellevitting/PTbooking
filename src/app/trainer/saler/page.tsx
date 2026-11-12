"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getMondayOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(monday: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getSlotsForDate(date: Date) {
  const startHour = isWeekend(date) ? 9 : 14;
  const slots = [];
  for (let h = startHour; h < 21; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

function dateToISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DAY_NAMES = ["man", "tir", "ons", "tor", "fre", "lør", "søn"];

interface Room {
  id: string;
  name: string;
}

export default function SalerPage() {
  const router = useRouter();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(true);

  const [weekStart, setWeekStart] = useState(getMondayOfWeek(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [selected, setSelected] = useState<Map<string, Set<string>>>(new Map());
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [existingSlots, setExistingSlots] = useState<Set<string>>(new Set());
  const [customTime, setCustomTime] = useState("");
  const [customTimeError, setCustomTimeError] = useState("");

  const weekDays = getWeekDays(weekStart);
  const weekNumber = getWeekNumber(weekStart);

  // Hent salene til klubben, så eksisterende tider for den første
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("club_id").eq("id", user.id).single();
      const clubId = (profile as any)?.club_id;
      if (!clubId) { setRoomsLoading(false); return; }
      const { data: roomRows } = await supabase
        .from("rooms")
        .select("id, name")
        .eq("club_id", clubId)
        .order("sort_order");
      setRooms(roomRows ?? []);
      const first = roomRows?.[0]?.id ?? null;
      setActiveRoom(first);
      setRoomsLoading(false);
      if (first) fetchExistingSlots(first, today);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchExistingSlots(roomId: string, date: Date) {
    const supabase = createClient();
    const dateStr = dateToISO(date);
    const dayStart = new Date(`${dateStr}T00:00:00`).toISOString();
    const dayEnd = new Date(`${dateStr}T23:59:59`).toISOString();

    const { data: slots } = await supabase
      .from("room_slots")
      .select("start_at")
      .eq("room_id", roomId)
      .gte("start_at", dayStart)
      .lte("start_at", dayEnd);

    const times = new Set((slots ?? []).map((s) => {
      const d = new Date(s.start_at);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }));
    setExistingSlots(times);
  }

  function pickRoom(roomId: string) {
    setActiveRoom(roomId);
    setSelected(new Map());
    setSuccess(false);
    setError("");
    if (selectedDate) fetchExistingSlots(roomId, selectedDate);
  }

  function prevWeek() {
    if (!activeRoom) return;
    const prev = new Date(weekStart);
    prev.setDate(weekStart.getDate() - 7);
    if (prev >= getMondayOfWeek(today)) {
      setWeekStart(prev);
      const days = getWeekDays(prev);
      const firstAvailable = days.find((d) => d >= today) ?? days[0];
      setSelectedDate(firstAvailable);
      setSuccess(false);
      fetchExistingSlots(activeRoom, firstAvailable);
    }
  }

  function nextWeek() {
    if (!activeRoom) return;
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + 7);
    setWeekStart(next);
    const days = getWeekDays(next);
    const firstAvailable = days.find((d) => d >= today) ?? days[0];
    setSelectedDate(firstAvailable);
    setSuccess(false);
    fetchExistingSlots(activeRoom, firstAvailable);
  }

  async function pickDate(date: Date) {
    if (date < today || !activeRoom) return;
    setSelectedDate(date);
    setSuccess(false);
    setError("");
    setCustomTime("");
    setCustomTimeError("");
    await fetchExistingSlots(activeRoom, date);
  }

  function toggleSlot(slot: string) {
    if (!selectedDate) return;
    const dateKey = dateToISO(selectedDate);
    setSelected((prev) => {
      const next = new Map(prev);
      const daySlots = new Set(next.get(dateKey) ?? []);
      daySlots.has(slot) ? daySlots.delete(slot) : daySlots.add(slot);
      if (daySlots.size === 0) next.delete(dateKey); else next.set(dateKey, daySlots);
      return next;
    });
  }

  function addCustomTime() {
    if (!selectedDate || !customTime) return;
    if (existingSlots.has(customTime)) { setCustomTimeError("Allerede publisert"); return; }
    const isToday = dateToISO(selectedDate) === dateToISO(today);
    if (isToday) {
      const [h, m] = customTime.split(":").map(Number);
      const slotTime = new Date();
      slotTime.setHours(h, m, 0, 0);
      if (slotTime <= new Date()) { setCustomTimeError("Tidspunktet er passert"); return; }
    }
    setCustomTimeError("");
    const dateKey = dateToISO(selectedDate);
    setSelected((prev) => {
      const next = new Map(prev);
      const daySlots = new Set(next.get(dateKey) ?? []);
      daySlots.add(customTime);
      next.set(dateKey, daySlots);
      return next;
    });
    setCustomTime("");
  }

  const totalSelected = Array.from(selected.values()).reduce((sum, s) => sum + s.size, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (totalSelected === 0 || !activeRoom) return;
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const rows: { room_id: string; start_at: string; end_at: string }[] = [];
    for (const [dateKey, times] of selected.entries()) {
      const baseDate = new Date(`${dateKey}T00:00:00`);
      for (const time of times) {
        const [hours, minutes] = time.split(":").map(Number);
        const start = new Date(baseDate);
        start.setHours(hours, minutes, 0, 0);
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        rows.push({ room_id: activeRoom, start_at: start.toISOString(), end_at: end.toISOString() });
      }
    }
    const { error: insertError } = await supabase.from("room_slots").insert(rows);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("En eller flere av tidene du valgte finnes allerede. Oppdater siden og prøv igjen.");
      } else {
        setError("Noe gikk galt: " + insertError.message);
      }
      setSaving(false);
    } else {
      const { data: trainerProfile } = await supabase
        .from("profiles")
        .select("name, club_id")
        .eq("id", user.id)
        .single();

      const roomName = rooms.find(r => r.id === activeRoom)?.name ?? "Sal";

      const { data: recipients } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["dancer", "parent"])
        .or("notify_new_slots.is.null,notify_new_slots.eq.true")
        .eq("club_id", trainerProfile?.club_id ?? "");

      if (recipients && recipients.length > 0) {
        const trainerName = trainerProfile?.name ?? "Treneren";
        const uniqueDates = [...new Set(rows.map(r => {
          const d = new Date(r.start_at);
          return d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
        }))];
        const dateStr = uniqueDates.join(", ");
        const message = `${trainerName} har lagt ut ${rows.length} ledig${rows.length === 1 ? "" : "e"} tid${rows.length === 1 ? "" : "er"} i ${roomName} til egentrening: ${dateStr}`;
        const notifRows = recipients.map(r => ({ user_id: r.id, message }));
        await supabase.from("notifications").insert(notifRows);

        // Send push-varsel til dansere/foreldre
        fetch("/api/notify-new-slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userIds: recipients.map(r => r.id),
            message,
          }),
        }).catch(() => {});
      }

      setSelected(new Map());
      setSaving(false);
      setSuccess(true);
      if (activeRoom && selectedDate) fetchExistingSlots(activeRoom, selectedDate);
    }
  }

  const slots = selectedDate ? getSlotsForDate(selectedDate) : [];

  if (roomsLoading) {
    return <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 page-safe-top text-gray-400 text-sm">Laster…</main>;
  }

  if (rooms.length === 0) {
    return (
      <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 page-safe-top">
        <div className="max-w-lg mx-auto">
          <button onClick={() => router.push("/trainer/dashboard")} className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200 mb-2 -ml-2">
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <h1 className="text-2xl font-bold mb-6">Legg ut ledige tider – saler</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Klubben din har ingen saler satt opp ennå.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 page-safe-top">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.push("/trainer/dashboard")} className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200 mb-2 -ml-2">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-2xl font-bold mb-6">Legg ut ledige tider – saler</h1>

        {/* Sal-velger */}
        {rooms.length > 1 && (
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
            {rooms.map(r => (
              <button
                key={r.id}
                type="button"
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
        )}

        <Card className="mb-4">
          <CardContent className="pt-4">
            {/* Måneds-/årsvelger */}
            <div className="mb-3">
              <select
                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                value={`${weekStart.getFullYear()}-${weekStart.getMonth()}`}
                onChange={(e) => {
                  if (!activeRoom) return;
                  const [year, month] = e.target.value.split("-").map(Number);
                  const firstOfMonth = new Date(year, month, 1);
                  const monday = getMondayOfWeek(firstOfMonth < today ? today : firstOfMonth);
                  setWeekStart(monday);
                  const firstAvailable = getWeekDays(monday).find(d => d >= today) ?? getWeekDays(monday)[0];
                  setSelectedDate(firstAvailable);
                  fetchExistingSlots(activeRoom, firstAvailable);
                }}
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
                  return (
                    <option key={i} value={`${d.getFullYear()}-${d.getMonth()}`}>
                      {d.toLocaleDateString("nb-NO", { month: "long", year: "numeric" })}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center justify-between mb-4">
              <button onClick={prevWeek} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 text-xl">‹</button>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Uke {weekNumber}</span>
              <button onClick={nextWeek} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 text-xl">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, i) => {
                const isPast = day < today;
                const isSelected = selectedDate && dateToISO(day) === dateToISO(selectedDate);
                const isToday = dateToISO(day) === dateToISO(today);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickDate(day)}
                    disabled={isPast}
                    className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-[#3A3A3A] text-[#E2A9F1]"
                        : isPast
                        ? "text-gray-300 dark:text-gray-600 cursor-default"
                        : isToday
                        ? "bg-[#edd5f9] dark:bg-[#E2A9F1]/15 text-[#c87de0] hover:bg-[#E2A9F1]/30"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span className="text-xs uppercase">{DAY_NAMES[i]}</span>
                    <span className="text-lg font-semibold">{day.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base capitalize">
                {selectedDate.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
                <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">
                  {isWeekend(selectedDate) ? "09:00–21:00" : "14:00–21:00"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot) => {
                    const isExisting = existingSlots.has(slot);
                    const isSelected = selectedDate ? (selected.get(dateToISO(selectedDate))?.has(slot) ?? false) : false;
                    const isToday = selectedDate && dateToISO(selectedDate) === dateToISO(today);
                    const isPastSlot = isToday && (() => {
                      const [h, m] = slot.split(":").map(Number);
                      const slotTime = new Date();
                      slotTime.setHours(h, m, 0, 0);
                      return slotTime <= new Date();
                    })();
                    const disabled = isExisting || isPastSlot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => !disabled && toggleSlot(slot)}
                        disabled={disabled}
                        title={isExisting ? "Allerede publisert" : isPastSlot ? "Tidspunktet er passert" : undefined}
                        className={`py-2 px-1 rounded-lg text-sm font-medium border transition-colors ${
                          isExisting
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-800 cursor-not-allowed line-through"
                            : isPastSlot
                            ? "bg-gray-50 dark:bg-gray-950 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-800 cursor-not-allowed"
                            : isSelected
                            ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A]"
                            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#E2A9F1]"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                {(() => {
                  const customTimesForDay = selectedDate
                    ? Array.from(selected.get(dateToISO(selectedDate)) ?? []).filter(t => !slots.includes(t)).sort()
                    : [];
                  if (customTimesForDay.length === 0) return null;
                  return (
                    <div className="flex flex-wrap gap-2">
                      {customTimesForDay.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleSlot(t)}
                          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-sm font-medium border bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A]"
                        >
                          {t} ✕
                        </button>
                      ))}
                    </div>
                  );
                })()}

                <div className="border-t dark:border-gray-700 pt-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Egendefinert tid utenom listen over</p>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => { setCustomTime(e.target.value); setCustomTimeError(""); }}
                      className="flex-1 border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={addCustomTime}
                      disabled={!customTime}
                      className="px-4 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      + Legg til
                    </button>
                  </div>
                  {customTimeError && <p className="text-xs text-red-500 mt-1">{customTimeError}</p>}
                </div>

                {selectedDate && (selected.get(dateToISO(selectedDate))?.size ?? 0) > 0 && (
                  <p className="text-sm text-[#E2A9F1]">
                    {selected.get(dateToISO(selectedDate))!.size} valgt denne dagen
                  </p>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-600">Ledige tider lagt ut!</p>}

                <Button
                  type="submit"
                  className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white"
                  disabled={saving || totalSelected === 0}
                >
                  {saving ? "Lagrer..." : `Legg ut ${totalSelected > 0 ? totalSelected + " " : ""}time${totalSelected !== 1 ? "r" : ""}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
