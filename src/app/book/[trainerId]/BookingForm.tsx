"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


interface Slot {
  id: string;
  start_at: string;
  end_at: string;
}

interface Props {
  slots: Slot[];
  trainerId: string;
  bookerId: string;
  bookerName: string;
  bookerRole: string;
  danceStyles: string[];
}

function groupByDate(slots: Slot[]) {
  const groups: Record<string, Slot[]> = {};
  for (const slot of slots) {
    const date = new Date(slot.start_at).toLocaleDateString("nb-NO", {
      weekday: "long", day: "numeric", month: "long"
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(slot);
  }
  return groups;
}

export default function BookingForm({ slots, bookerId, bookerName, bookerRole, danceStyles }: Props) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [dancerName, setDancerName] = useState(bookerRole === "dancer" ? bookerName : "");
  const [danceStyle, setDanceStyle] = useState("");
  const [step, setStep] = useState<"pick" | "confirm">("pick");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const grouped = groupByDate(slots);

  async function handleBook() {
    if (!selectedSlot || !danceStyle || !dancerName) return;
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error: bookError } = await supabase.from("bookings").insert({
      slot_id: selectedSlot.id,
      booker_id: bookerId,
      dancer_name: dancerName,
      dance_style: danceStyle,
      status: "confirmed",
    });

    if (bookError) {
      setError("Noe gikk galt, prøv igjen");
      setLoading(false);
      return;
    }

    await supabase
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", selectedSlot.id);

    // Send varsel til treneren
    const start = new Date(selectedSlot.start_at);
    const tidspunkt = start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" }) +
      " kl. " + start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });

    const { data: slotData } = await supabase
      .from("availability_slots")
      .select("trainer_id")
      .eq("id", selectedSlot.id)
      .single();

    if (slotData) {
      await supabase.from("notifications").insert({
        user_id: slotData.trainer_id,
        message: `${dancerName} har booket time i ${danceStyle} – ${tidspunkt}`,
      });
    }

    router.push("/booking/kvittering?success=1");
  }

  if (step === "confirm" && selectedSlot) {
    const start = new Date(selectedSlot.start_at);
    const end = new Date(selectedSlot.end_at);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bekreft booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <p className="text-sm text-gray-500">Tid</p>
            <p className="font-medium capitalize">
              {start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="text-gray-600">
              {start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}–{end.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Danserens navn</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={dancerName}
              onChange={(e) => setDancerName(e.target.value)}
              placeholder="Navn på danseren"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Dansestil</label>
            <div className="grid grid-cols-2 gap-2">
              {danceStyles.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setDanceStyle(style)}
                  className={`py-2 px-3 rounded-lg text-sm border transition-colors ${
                    danceStyle === style
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-purple-400"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={handleBook}
            disabled={loading || !danceStyle || !dancerName}
          >
            {loading ? "Booker..." : "Bekreft booking"}
          </Button>
          <button
            type="button"
            onClick={() => setStep("pick")}
            className="w-full text-sm text-gray-400 hover:text-gray-600"
          >
            Gå tilbake
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-lg">Velg tid</h2>
      {Object.entries(grouped).map(([date, daySlots]) => (
        <div key={date}>
          <p className="text-sm font-medium text-gray-500 capitalize mb-2">{date}</p>
          <div className="grid grid-cols-3 gap-2">
            {daySlots.map((slot) => {
              const start = new Date(slot.start_at);
              const time = start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
              const isSelected = selectedSlot?.id === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    isSelected
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-purple-400"
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <Button
        className="w-full bg-purple-600 hover:bg-purple-700"
        disabled={!selectedSlot}
        onClick={() => setStep("confirm")}
      >
        Gå videre
      </Button>
    </div>
  );
}
