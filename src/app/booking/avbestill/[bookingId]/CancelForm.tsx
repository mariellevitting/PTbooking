"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  bookingId: string;
  slotId: string;
  trainerId: string;
  dancerName: string;
  danceStyle: string;
  startAt: string;
  withinDeadline: boolean;
}

export default function CancelForm({ bookingId, slotId, trainerId, dancerName, danceStyle, startAt, withinDeadline }: Props) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const start = new Date(startAt);
  const tidspunkt = start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" }) +
    " kl. " + start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });

  async function handleCancel() {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error: cancelError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (cancelError) {
      setError("Noe gikk galt, prøv igjen");
      setLoading(false);
      return;
    }

    await supabase
      .from("availability_slots")
      .update({ is_booked: false })
      .eq("id", slotId);

    await supabase.from("notifications").insert({
      user_id: trainerId,
      message: `${dancerName} har avbestilt timen i ${danceStyle} – ${tidspunkt}`,
    });

    router.push("/dancer/dashboard?avbestilt=1");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 space-y-2">
          <p className="text-sm text-gray-500">Time som avbestilles</p>
          <p className="font-semibold capitalize">{tidspunkt}</p>
          <p className="text-sm text-purple-600">{dancerName} · {danceStyle}</p>
        </CardContent>
      </Card>

      {withinDeadline && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-1">Sen avbestilling</p>
          <p className="text-sm text-red-600">
            Timen er om mindre enn 24 timer. Ved avbestilling så sent må timen betales i sin helhet.
          </p>
        </div>
      )}

      <div className="bg-white border rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-purple-600 w-4 h-4"
          />
          <span className="text-sm text-gray-700">
            {withinDeadline
              ? "Jeg forstår at timen må betales i sin helhet og ønsker likevel å avbestille."
              : "Jeg bekrefter at jeg ønsker å avbestille denne timen."}
          </span>
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        className="w-full bg-red-500 hover:bg-red-600 text-white"
        onClick={handleCancel}
        disabled={!confirmed || loading}
      >
        {loading ? "Avbestiller..." : "Avbestill time"}
      </Button>

      <button
        type="button"
        onClick={() => router.back()}
        className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
      >
        Gå tilbake
      </button>
    </div>
  );
}
