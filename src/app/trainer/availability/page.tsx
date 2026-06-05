"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getNextDays(count: number) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
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
  slots.push("21:00");
  return slots;
}

function formatDayName(date: Date) {
  return date.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "short" });
}

function dateToISO(date: Date) {
  return date.toISOString().split("T")[0];
}

const DAYS = getNextDays(14);

export default function AvailabilityPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function pickDate(date: Date) {
    setSelectedDate(date);
    setSelected(new Set());
    setSuccess(false);
    setError("");
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
      const start = new Date(`${dateStr}T${time}:00`);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      return { trainer_id: user.id, start_at: start.toISOString(), end_at: end.toISOString() };
    });

    const { error: insertError } = await supabase.from("availability_slots").insert(rows);

    if (insertError) {
      setError("Noe gikk galt, prøv igjen");
    } else {
      setSuccess(true);
      setSelected(new Set());
    }
    setSaving(false);
  }

  const slots = selectedDate ? getSlotsForDate(selectedDate) : [];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.push("/trainer/dashboard")} className="text-sm text-purple-600 hover:underline mb-6 block">
          ← Tilbake
        </button>
        <h1 className="text-2xl font-bold mb-6">Legg ut ledige tider</h1>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Velg dag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {DAYS.map((day) => {
                const isSelected = selectedDate && dateToISO(day) === dateToISO(selectedDate);
                const weekend = isWeekend(day);
                return (
                  <button
                    key={dateToISO(day)}
                    type="button"
                    onClick={() => pickDate(day)}
                    className={`py-3 px-4 rounded-lg text-sm text-left border transition-colors ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-purple-400"
                    }`}
                  >
                    <span className="font-medium capitalize">{formatDayName(day)}</span>
                    <span className={`block text-xs mt-0.5 ${isSelected ? "text-purple-200" : "text-gray-400"}`}>
                      {weekend ? "09:00–21:00" : "14:00–21:00"}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base capitalize">{formatDayName(selectedDate)}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {slots.slice(0, -1).map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleSlot(slot)}
                      className={`py-2 px-1 rounded-lg text-sm font-medium border transition-colors ${
                        selected.has(slot)
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-gray-700 border-gray-200 hover:border-purple-400"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
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
