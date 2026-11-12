"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface Props {
  bookingId: string;
  bookerId: string;
  dancerName: string;
  roomName: string;
  startAt: string;
}

export default function TrainerCancelRoomForm({ bookingId, bookerId, dancerName, roomName, startAt }: Props) {
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
      .from("room_bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (cancelError) {
      setError("Noe gikk galt, prøv igjen");
      setLoading(false);
      return;
    }

    const cancelMessage = `Treneren har avbestilt ${roomName} til egentrening – ${tidspunkt}`;
    await supabase.from("notifications").insert({
      user_id: bookerId,
      message: cancelMessage,
    });

    // Send push-varsel til danser/forelder
    fetch("/api/notify-trainer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainerId: bookerId, message: cancelMessage }),
    }).catch(() => {});

    router.push("/trainer/saler");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Økt som avbestilles</p>
        <p className="font-semibold capitalize">{tidspunkt}</p>
        <p className="text-sm text-[#E2A9F1]">{roomName} · {dancerName}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-700">
          {dancerName} får varsel om at egentreningen er avbestilt, og tiden blir ledig igjen.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-[#3A3A3A] w-4 h-4"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Jeg bekrefter at jeg ønsker å avbestille denne egentreningen.
          </span>
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        className="w-full bg-red-500 hover:bg-red-600 text-white"
        onClick={handleCancel}
        disabled={!confirmed || loading}
      >
        {loading ? "Avbestiller..." : "Avbestill egentrening"}
      </Button>

      <button
        type="button"
        onClick={() => router.back()}
        className="w-full text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 py-2"
      >
        Gå tilbake
      </button>
    </div>
  );
}
