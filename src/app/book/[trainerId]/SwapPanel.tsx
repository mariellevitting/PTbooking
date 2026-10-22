"use client";

import { useState } from "react";
import { X, ArrowLeftRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatTime } from "@/lib/dateUtils";

export interface BookedSlot {
  slot_id: string;
  start_at: string;
  end_at: string;
  booking_id: string;
  dancer_name: string;
  owner_id: string;
  booker_id: string;
}

function when(iso: string) {
  const d = new Date(iso);
  return `${formatDate(d, { weekday: "long", day: "numeric", month: "long" })} kl ${formatTime(d)}`;
}

export default function SwapPanel({ target, mine, trainerName, onClose }: {
  target: BookedSlot;
  mine: BookedSlot[];
  trainerName: string;
  onClose: () => void;
}) {
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<BookedSlot | null>(null);

  async function send(my: BookedSlot) {
    if (sending) return;
    setConfirming(null);
    setSending(my.booking_id);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.rpc("request_swap", { p_my_booking: my.booking_id, p_target_booking: target.booking_id });
    if (err) { setError(err.message); setSending(null); return; }
    const message = `${my.dancer_name} vil bytte privattime med deg hos ${trainerName}: din time ${when(target.start_at)} mot ${when(my.start_at)}. Åpne appen for å svare.`;
    await supabase.from("notifications").insert({ user_id: target.owner_id, message });
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [target.owner_id], title: "Bytteforespørsel", message }),
    }).catch(() => {});
    setSending(null);
    setSent(true);
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#E2A9F1]/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Opptatt av {target.dancer_name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{when(target.start_at)}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Lukk" className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>

      {sent ? (
        <p className="text-sm text-green-600 dark:text-green-400">Forespørsel sendt til {target.dancer_name}. Du får beskjed når den er besvart.</p>
      ) : mine.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Du må ha en booket time hos {trainerName} for å kunne be om bytte.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-300">Velg hvilken av dine timer du vil bytte:</p>
          <div className="space-y-2">
            {mine.map(m => (
              <button
                key={m.booking_id}
                type="button"
                onClick={() => setConfirming(m)}
                disabled={!!sending}
                className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#E2A9F1] text-sm disabled:opacity-50"
              >
                <span className="font-medium text-[#9b59c4] dark:text-[#E2A9F1]">{sending === m.booking_id ? "Sender…" : "Bytteforespørsel"}</span>{" "}
                <span className="text-gray-700 dark:text-gray-300">{when(m.start_at)}</span>
                {m.dancer_name && <span className="text-gray-400"> · {m.dancer_name}</span>}
              </button>
            ))}
          </div>
        </>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {confirming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-labelledby="swap-confirm-title">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirming(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-5">
            <div className="w-11 h-11 rounded-full bg-[#f5eeff] dark:bg-[#E2A9F1]/15 flex items-center justify-center mb-3">
              <ArrowLeftRight size={20} className="text-[#c87de0]" />
            </div>
            <h3 id="swap-confirm-title" className="text-lg font-semibold text-gray-900 dark:text-white">Send bytteforespørsel?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Er du sikker på at du vil sende bytteforespørsel til <span className="font-semibold">{target.dancer_name}</span>?
            </p>
            <div className="mt-3 rounded-xl bg-gray-50 dark:bg-gray-800 p-3 text-sm space-y-1">
              <p className="text-gray-500 dark:text-gray-400">Din time: <span className="text-gray-800 dark:text-gray-100 capitalize">{when(confirming.start_at)}</span></p>
              <p className="text-gray-500 dark:text-gray-400">Ønsket time: <span className="text-gray-800 dark:text-gray-100 capitalize">{when(target.start_at)}</span></p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Byttet skjer først når {target.dancer_name} har godkjent forespørselen. Til da beholder dere begge timene deres.
            </p>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setConfirming(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                Avbryt
              </button>
              <button type="button" onClick={() => send(confirming)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#3A3A3A] text-[#E2A9F1] dark:bg-[#c87de0] dark:text-white">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
