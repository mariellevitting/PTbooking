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

interface Props {
  trainerId: string;
  danceStyles: string[];
}

export default function BookForDancerForm({ trainerId, danceStyles }: Props) {
  const router = useRouter();
  const today = dateToISO(new Date());

  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [dancer1, setDancer1] = useState("");
  const [dancer2, setDancer2] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedDate = date ? new Date(date + "T12:00:00") : null;
  const timeSlots = selectedDate ? getTimeSlots(selectedDate) : [];
  const double = isDouble(style);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time || !dancer1 || !style) return;
    if (double && !dancer2) return;

    setLoading(true);
    setError("");

    const supabase = createClient();
    const [hours, minutes] = time.split(":").map(Number);
    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const dancerName = double ? `${dancer1} & ${dancer2}` : dancer1;

    // 1. Opprett slot
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

    // 2. Book sloten
    const { error: bookError } = await supabase.from("bookings").insert({
      slot_id: slot.id,
      booker_id: trainerId,
      dancer_name: dancerName,
      dance_style: style,
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
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Dato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dato</label>
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => { setDate(e.target.value); setTime(""); }}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
              required
            />
          </div>

          {/* Tid */}
          {date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tidspunkt</label>
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
            </div>
          )}

          {/* Danseform */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Danseform</label>
            <div className="flex flex-wrap gap-2">
              {danceStyles.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setStyle(s); setDancer2(""); }}
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
          </div>

          {/* Danser(e) */}
          {style && (
            <div className="space-y-3">
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
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={loading || !date || !time || !style || !dancer1 || (double && !dancer2)}
          >
            {loading ? "Lagrer..." : "Book time"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
