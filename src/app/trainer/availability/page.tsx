"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AvailabilityPage() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const startAt = new Date(`${date}T${startTime}:00`);
    const endAt = new Date(`${date}T${endTime}:00`);

    if (endAt <= startAt) {
      setError("Slutttid må være etter starttid");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("availability_slots")
      .insert({ trainer_id: user.id, start_at: startAt.toISOString(), end_at: endAt.toISOString() });

    if (insertError) {
      setError("Noe gikk galt, prøv igjen");
    } else {
      setSuccess(true);
      setDate("");
      setStartTime("");
      setEndTime("");
    }
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.push("/trainer/dashboard")} className="text-sm text-purple-600 hover:underline mb-6 block">
          ← Tilbake
        </button>
        <h1 className="text-2xl font-bold mb-6">Legg ut ledig tid</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ny ledig time</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dato</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fra</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Til</label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-600">Ledig tid lagt ut!</p>}
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={saving}>
                {saving ? "Lagrer..." : "Legg ut tid"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
