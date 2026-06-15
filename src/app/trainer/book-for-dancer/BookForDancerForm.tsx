"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DOUBLE_STYLES = ["Freestyle dobbel", "Slow dobbel"];

function isDouble(style: string) {
  return DOUBLE_STYLES.includes(style);
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

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getTimeSlots(date: Date) {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  const startHour = isWeekend ? 9 : 14;
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

interface Props {
  trainerId: string;
  danceStyles: string[];
}

export default function BookForDancerForm({ trainerId, danceStyles }: Props) {
  const router = useRouter();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weekStart, setWeekStart] = useState(getMondayOfWeek(today));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [time, setTime] = useState("");
  const [dancer1, setDancer1] = useState("");
  const [dancer2, setDancer2] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const weekDays = getWeekDays(weekStart);
  const weekNumber = getWeekNumber(weekStart);
  const timeSlots = getTimeSlots(selectedDate);
  const double = isDouble(style);

  function prevWeek() {
    const prev = new Date(weekStart);
    prev.setDate(weekStart.getDate() - 7);
    if (prev >= getMondayOfWeek(today)) {
      setWeekStart(prev);
      const days = getWeekDays(prev);
      const first = days.find(d => d >= today) ?? days[0];
      setSelectedDate(first);
      setTime("");
    }
  }

  function nextWeek() {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + 7);
    setWeekStart(next);
    const days = getWeekDays(next);
    setSelectedDate(days[0]);
    setTime("");
  }

  function pickDate(date: Date) {
    if (date < today) return;
    setSelectedDate(date);
    setTime("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !time || !dancer1) return;
    if (double && !dancer2) return;

    setLoading(true);
    setError("");

    const supabase = createClient();
    const dateStr = dateToISO(selectedDate);
    const start = new Date(`${dateStr}T${time}:00`);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const dancerName = double ? `${dancer1} & ${dancer2}` : dancer1;

    const { data: slot, error: slotError } = await supabase
      .from("availability_slots")
      .insert({ trainer_id: trainerId, start_at: start.toISOString(), end_at: end.toISOString() })
      .select("id")
      .single();

    if (slotError || !slot) {
      setError("Klarte ikke opprette time. Kanskje det allerede finnes en ledig tid på dette tidspunktet?");
      setLoading(false);
      return;
    }

    const { error: bookError } = await supabase.from("bookings").insert({
      slot_id: slot.id,
      booker_id: trainerId,
      dancer_name: dancerName,
      dance_style: style || "",
      status: "confirmed",
    });

    if (bookError) {
      setError("Timen ble opprettet men booking feilet. Prøv igjen.");
      setLoading(false);
      return;
    }

    router.push("/trainer/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Navn – øverst */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {double ? "Danser 1" : "Danserens navn"}
            </label>
            <input
              type="text"
              value={dancer1}
              onChange={(e) => setDancer1(e.target.value)}
              placeholder="Fullt navn"
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
              required
            />
          </div>
          {double && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danser 2</label>
              <input
                type="text"
                value={dancer2}
                onChange={(e) => setDancer2(e.target.value)}
                placeholder="Fullt navn"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                required
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ukekalender */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevWeek} className="text-gray-400 hover:text-gray-700 px-2 text-xl">‹</button>
            <span className="font-semibold text-gray-700 text-sm">Uke {weekNumber}</span>
            <button type="button" onClick={nextWeek} className="text-gray-400 hover:text-gray-700 px-2 text-xl">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, i) => {
              const isPast = day < today;
              const isSelected = dateToISO(day) === dateToISO(selectedDate);
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

      {/* Tidspunkt */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2 capitalize">
            {selectedDate.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={`py-2 px-1 rounded-lg text-sm font-medium border transition-colors ${
                  time === slot
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-purple-400"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danseform – valgfritt */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Danseform <span className="text-gray-400 font-normal">(valgfritt)</span></p>
          <div className="flex flex-wrap gap-2">
            {danceStyles.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStyle(style === s ? "" : s); setDancer2(""); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  style === s
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-purple-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        type="submit"
        className="w-full bg-purple-600 hover:bg-purple-700"
        disabled={loading || !time || !dancer1 || (double && !dancer2)}
      >
        {loading ? "Lagrer..." : "Book time"}
      </Button>
    </form>
  );
}
