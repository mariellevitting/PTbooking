"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface Props {
  slotId: string;
  startAt: string;
  endAt: string;
}

export default function DeleteSlotForm({ slotId, startAt, endAt }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const start = new Date(startAt);
  const end = new Date(endAt);
  const tidspunkt =
    start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" }) +
    " kl. " +
    start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" }) +
    "–" +
    end.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });

  async function handleDelete() {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("availability_slots")
      .delete()
      .eq("id", slotId);

    if (deleteError) {
      setError("Noe gikk galt, prøv igjen");
      setLoading(false);
      return;
    }

    router.push("/trainer/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Tid som slettes</p>
        <p className="font-semibold">{tidspunkt.charAt(0).toUpperCase() + tidspunkt.slice(1)}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-sm text-amber-700">Tidsluken fjernes og vil ikke lenger være synlig for dansere.</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        className="w-full bg-red-500 hover:bg-red-600 text-white"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? "Sletter..." : "Slett tid"}
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
