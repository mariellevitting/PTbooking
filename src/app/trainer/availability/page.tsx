"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function generateSlots() {
  const slots = [];
  for (let h = 6; h < 22; h++) {
    for (const m of [0, 30]) {
      const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      slots.push(label);
    }
  }
  return slots;
}

const ALL_SLOTS = generateSlots();

export default function AvailabilityPage() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function toggleSlot(slot: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(slot) ? next.delete(slot) : next.add(slot);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || selected.size === 0) {
      setError("Velg dato og minst én tid");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const rows = Array.from(selected).map((time) => {
      const [h, m] = time.split(":").map(Number);
      const start = new Date(`${date}T${time}:00`);
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

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.push("/trainer/dashboard")} className="text-sm text-purple-600 hover:underline mb-6 block">
          ← Tilbake
        </button>
        <h1 className="text-2xl font-bold mb-6">Legg ut ledige tider</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Velg dato</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setSelected(new Set()); setSuccess(false); }}
                min={new Date().toISOString().split("T")[0]}
                required
              />

              {date && (
                <div>
                  <p className="text-sm font-medium mb-3">Velg ledige tider (30 min hver)</p>
                  <div className="grid grid-cols-4 gap-2">
                    {ALL_SLOTS.map((slot) => (
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
                    <p className="text-sm text-purple-600 mt-3">{selected.size} time{selected.size !== 1 ? "r" : ""} valgt</p>
                  )}
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-600">Ledige tider lagt ut!</p>}

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={saving || !date || selected.size === 0}
              >
                {saving ? "Lagrer..." : `Legg ut ${selected.size > 0 ? selected.size + " " : ""}time${selected.size !== 1 ? "r" : ""}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
