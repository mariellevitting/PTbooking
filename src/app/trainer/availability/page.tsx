"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function AvailabilityPage() {
  const router = useRouter();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weekStart, setWeekStart] = useState(getMondayOfWeek(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [existingSlots, setExistingSlots] = useState<Set<string>>(new Set());

  const weekDays = getWeekDays(weekStart);
  const weekNumber = getWeekNumber(weekStart);

  // Hent eksisterende slots når siden lastes (for dagens dato)
  useEffect(() => {
    if (today) fetchExistingSlots(today);
  }, []);

  async function fetchExistingSlots(date: Date) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dateStr = dateToISO(date);
    const dayStart = new Date(`${dateStr}T00:00:00`).toISOString();
    const dayEnd = new Date(`${dateStr}T23:59:59`).toISOString();

    const { data: slots } = await supabase
      .from("availability_slots")
      .select("start_at")
      .eq("trainer_id", user.id)
      .gte("start_at", dayStart)
      .lte("start_at", dayEnd);

    const times = new Set((slots ?? []).map((s) => {
      const d = new Date(s.start_at);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }));
    setExistingSlots(times);
  }

  function prevWeek() {
    const prev = new Date(weekStart);
    prev.setDate(weekStart.getDate() - 7);
    if (prev >= getMondayOfWeek(today)) {
      setWeekStart(prev);
      const days = getWeekDays(prev);
      const firstAvailable = days.find((d) => d >= today) ?? days[0];
      setSelectedDate(firstAvailable);
      setSelected(new Set());
      setSuccess(false);
    }
  }

  function nextWeek() {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + 7);
    setWeekStart(next);
    const days = getWeekDays(next);
    const firstAvailable = days.find((d) => d >= today) ?? days[0];
    setSelectedDate(firstAvailable);
    setSelected(new Set());
    setSuccess(false);
  }

  async function pickDate(date: Date) {
    if (date < today) return;
    setSelectedDate(date);
    setSelected(new Set());
    setSuccess(false);
    setError("");
    await fetchExistingSlots(date);
  }

  function toggleSlot(slot: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(slot) ? next.delete(slot) : next.add(slot);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || selected.size === 0) return;
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dateStr = dateToISO(selectedDate);
    const rows = Array.from(selected).map((time) => {
      const [hours, minutes] = time.split(":").map(Number);
      const start = new Date(selectedDate);
      start.setHours(hours, minutes, 0, 0);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      return { trainer_id: user.id, start_at: start.toISOString(), end_at: end.toISOString() };
    });

    const { error: insertError } = await supabase.from("availability_slots").insert(rows);

    if (insertError) {
      setError("Noe gikk galt, prøv igjen");
      setSaving(false);
    } else {
      router.push("/trainer/dashboard");
      router.refresh();
    }
  }

  const slots = selectedDate ? getSlotsForDate(selectedDate) : [];

  return (
    <main className="bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.push("/trainer/dashboard")} className="text-sm text-purple-600 hover:underline mb-6 block">
          ← Tilbake
        </button>
        <h1 className="text-2xl font-bold mb-6">Legg ut ledige tider</h1>

        <Card className="mb-4">
          <CardContent className="pt-4">
            {/* Måneds-/årsvelger */}
            <div className="mb-3">
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
                value={`${weekStart.getFullYear()}-${weekStart.getMonth()}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split("-").map(Number);
                  const firstOfMonth = new Date(year, month, 1);
                  const monday = getMondayOfWeek(firstOfMonth < today ? today : firstOfMonth);
                  setWeekStart(monday);
                  const firstAvailable = getWeekDays(monday).find(d => d >= today) ?? getWeekDays(monday)[0];
                  setSelectedDate(firstAvailable);
                  setSelected(new Set());
                  fetchExistingSlots(firstAvailable);
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
              <button onClick={prevWeek} className="text-gray-400 hover:text-gray-700 px-2 text-xl">‹</button>
              <span className="font-semibold text-gray-700">Uke {weekNumber}</span>
              <button onClick={nextWeek} className="text-gray-400 hover:text-gray-700 px-2 text-xl">›</button>
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
                        ? "bg-purple-600 text-white"
                        : isPast
                        ? "text-gray-300 cursor-default"
                        : isToday
                        ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                        : "hover:bg-gray-100 text-gray-700"
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
                <span className="text-sm font-normal text-gray-400 ml-2">
                  {isWeekend(selectedDate) ? "09:00–21:00" : "14:00–21:00"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot) => {
                    const isExisting = existingSlots.has(slot);
                    const isSelected = selected.has(slot);
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
                            ? "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed line-through"
                            : isPastSlot
                            ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                            : isSelected
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-purple-400"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                {selected.size > 0 && (
                  <p className="text-sm text-purple-600">{selected.size} time{selected.size !== 1 ? "r" : ""} valgt</p>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-600">Ledige tider lagt ut!</p>}

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={saving || selected.size === 0}
                >
                  {saving ? "Lagrer..." : `Legg ut ${selected.size > 0 ? selected.size + " " : ""}time${selected.size !== 1 ? "r" : ""}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
