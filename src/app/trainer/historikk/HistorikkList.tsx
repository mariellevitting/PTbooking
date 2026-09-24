"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatTime } from "@/lib/dateUtils";

interface Booking {
  id: string;
  dancer_name: string;
  dance_style: string;
  status: string;
  paid?: boolean;
  receipt_reminders_sent?: number;
  booker_id?: string;
  linked_user_id?: string | null;
}

interface Slot {
  id: string;
  start_at: string;
  end_at: string;
  bookings?: Booking[] | null;
}

function KvitteringReminder({ booking, when, trainerName, trainerId }: { booking: Booking; when: string; trainerName: string; trainerId: string }) {
  const [count, setCount] = useState(booking.receipt_reminders_sent ?? 0);
  const [sending, setSending] = useState(false);

  const ids = [...new Set([booking.booker_id, booking.linked_user_id])]
    .filter((x): x is string => !!x && x !== trainerId);

  async function send() {
    if (sending || ids.length === 0) return;
    if (count === 0 && !confirm("Danseren/forelderen får et varsel om å sende bilde av kvitteringen. Sende nå?")) return;
    setSending(true);
    const message = `Husk å sende bilde av kvittering for privattimen ${when} til ${trainerName}.`;
    const supabase = createClient();
    await supabase.from("notifications").insert(ids.map(user_id => ({ user_id, message })));
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: ids, title: "Kvittering", message }),
    }).catch(() => {});
    await supabase.from("bookings").update({ receipt_reminders_sent: count + 1 }).eq("id", booking.id);
    setCount(c => c + 1);
    setSending(false);
  }

  if (ids.length === 0) return null;

  return (
    <button
      onClick={send}
      disabled={sending}
      className="text-xs text-[#9b59c4] dark:text-[#E2A9F1] hover:underline disabled:opacity-50 disabled:no-underline"
    >
      {sending ? "Sender…" : count === 0 ? "Purr på kvittering" : `Purr på kvittering igjen (${count})`}
    </button>
  );
}

function PaidToggle({ bookingId, initialPaid }: { bookingId: string; initialPaid: boolean }) {
  const router = useRouter();
  const [paid, setPaid] = useState(initialPaid);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle() {
    if (saving) return;
    setSaving(true);
    setFailed(false);
    const next = !paid;
    setPaid(next);
    const { data, error } = await createClient()
      .from("bookings")
      .update({ paid: next, paid_at: next ? new Date().toISOString() : null })
      .eq("id", bookingId)
      .select("paid")
      .maybeSingle();
    setSaving(false);
    if (error || !data || data.paid !== next) {
      setPaid(!next);
      setFailed(true);
      return;
    }
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        onClick={toggle}
        disabled={saving}
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
          paid
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
      >
        {paid ? <><Check size={12} strokeWidth={3} /> Betalt</> : "Marker betalt"}
      </button>
      {failed && <span className="text-xs text-red-500">Kunne ikke lagre</span>}
    </span>
  );
}

interface Props {
  monthGroups: [string, Slot[]][];
  trainerName: string;
  trainerId: string;
}

export default function HistorikkList({ monthGroups, trainerName, trainerId }: Props) {
  return (
    <div className="space-y-6">
      {monthGroups.map(([month, monthSlots]) => (
        <div key={month}>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{month}</p>
          <div className="space-y-2">
            {monthSlots.map((slot) => {
              const start = new Date(slot.start_at);
              const end = new Date(slot.end_at);
              const booking = slot.bookings?.find((b) => b.status === "confirmed");
              const dayLabel = formatDate(start, { weekday: "long", day: "numeric", month: "long" });
              return (
                <div key={slot.id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        {formatTime(start)}–{formatTime(end)}
                      </p>
                      {booking && (
                        <p className="text-sm text-[#E2A9F1] mt-0.5">
                          {booking.dancer_name} · {booking.dance_style}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full">Fullført</span>
                      {booking && <PaidToggle bookingId={booking.id} initialPaid={!!booking.paid} />}
                    </div>
                  </div>
                  {booking && !booking.paid && (
                    <div className="mt-2 pt-2 border-t dark:border-gray-700">
                      <KvitteringReminder booking={booking} when={`${dayLabel} kl ${formatTime(start)}`} trainerName={trainerName} trainerId={trainerId} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
