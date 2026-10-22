"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Fjerner en gjennomført time (f.eks. sen avbestilling) fra fullførte/historikk.
// Bookingen settes til "cancelled" i stedet for å slettes, så den kan gjenopprettes.
export default function RemoveCompletedBooking({ bookingId, dancerName }: { bookingId: string; dancerName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove() {
    if (busy) return;
    if (!confirm(`Slette privattimen med ${dancerName}? Den fjernes fra fullførte timer og historikk.`)) return;
    setBusy(true);
    setFailed(false);
    const { data, error } = await createClient()
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId)
      .select("status")
      .maybeSingle();
    setBusy(false);
    if (error || !data || data.status !== "cancelled") { setFailed(true); return; }
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button type="button" onClick={remove} disabled={busy} className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">
        {busy ? "Sletter…" : "Slett"}
      </button>
      {failed && <span className="text-xs text-red-500">Kunne ikke slette</span>}
    </span>
  );
}
