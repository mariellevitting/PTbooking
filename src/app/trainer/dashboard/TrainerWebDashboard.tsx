"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatTime } from "@/lib/dateUtils";

interface Booking {
  id: string;
  dancer_name: string;
  dance_style: string;
  status: string;
  paid?: boolean;
  receipt_reminders_sent?: number;
  booker_id?: string;
  linked_user_id?: string | null;
  booker?: { avatar_url?: string } | null;
  linked_profile?: { avatar_url?: string } | null;
}

interface Slot {
  id: string;
  start_at: string;
  end_at: string;
  is_booked: boolean;
  bookings?: Booking[];
}

interface CompletedSlot {
  id: string;
  start_at: string;
  end_at: string;
  bookings?: { id: string; dancer_name: string; dance_style: string; status: string; paid?: boolean; receipt_reminders_sent?: number; booker_id?: string; linked_user_id?: string | null }[];
}

interface Props {
  slots: Slot[];
  completedSlots: CompletedSlot[];
  trainerName: string;
  trainerId: string;
  freeCount: number;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function PaidToggle({ bookingId, initialPaid }: { bookingId: string; initialPaid: boolean }) {
  const router = useRouter();
  const [paid, setPaid] = useState(initialPaid);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    if (saving) return;
    setSaving(true);
    const next = !paid;
    setPaid(next);
    const { data, error } = await createClient()
      .from("bookings")
      .update({ paid: next, paid_at: next ? new Date().toISOString() : null })
      .eq("id", bookingId)
      .select("paid")
      .maybeSingle();
    setSaving(false);
    if (error || !data || data.paid !== next) { setPaid(!next); return; }
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
        paid
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200"
      }`}
    >
      {paid ? <><Check size={12} strokeWidth={3} /> Betalt</> : "Marker betalt"}
    </button>
  );
}

function KvitteringReminder({ booking, when, trainerName, trainerId }: { booking: { id: string; receipt_reminders_sent?: number; booker_id?: string; linked_user_id?: string | null }; when: string; trainerName: string; trainerId: string }) {
  const [count, setCount] = useState(booking.receipt_reminders_sent ?? 0);
  const [sending, setSending] = useState(false);
  const ids = [...new Set([booking.booker_id, booking.linked_user_id])].filter((x): x is string => !!x && x !== trainerId);
  if (ids.length === 0) return null;

  async function send() {
    if (sending) return;
    if (count === 0 && !confirm("Sende purring på kvittering?")) return;
    setSending(true);
    const message = `Husk å sende bilde av kvittering for privattimen ${when} til ${trainerName}.`;
    const supabase = createClient();
    await supabase.from("notifications").insert(ids.map(user_id => ({ user_id, message })));
    await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userIds: ids, title: "Kvittering", message }) }).catch(() => {});
    await supabase.from("bookings").update({ receipt_reminders_sent: count + 1 }).eq("id", booking.id);
    setCount(c => c + 1);
    setSending(false);
  }

  return (
    <button onClick={send} disabled={sending} className="text-xs text-[#9b59c4] dark:text-[#E2A9F1] hover:underline disabled:opacity-50">
      {sending ? "Sender…" : count === 0 ? "Purr på kvittering" : `Purr igjen (${count})`}
    </button>
  );
}

export default function TrainerWebDashboard({ slots, completedSlots, trainerName, trainerId, freeCount }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string>(dateKey(today));

  // Alle datoer som har slots (fremtid)
  const slotDates = new Set(slots.map(s => dateKey(new Date(s.start_at))));

  // Stats
  const confirmedCompleted = completedSlots.filter(s => s.bookings?.some(b => b.status === "confirmed"));
  const paidCount = confirmedCompleted.filter(s => s.bookings?.some(b => b.status === "confirmed" && b.paid)).length;
  const totalCompleted = confirmedCompleted.length;
  const unpaidCount = totalCompleted - paidCount;

  // Kalender
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // mandag=0
  const daysInMonth = lastDay.getDate();

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)); }

  const monthName = firstDay.toLocaleDateString("nb-NO", { month: "long", year: "numeric" });

  // Slots for valgt dato
  const selectedSlots = slots.filter(s => dateKey(new Date(s.start_at)) === selectedDate).sort((a, b) => a.start_at.localeCompare(b.start_at));
  const selectedDateObj = selectedDate ? new Date(selectedDate + "T12:00:00") : null;
  const selectedLabel = selectedDateObj ? selectedDateObj.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" }) : "";

  const DAY_LABELS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      {/* Venstre kolonne */}
      <div className="space-y-4">
        {/* Kalender */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 capitalize">{monthName}</span>
            <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: startDow }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = new Date(year, month, i + 1);
              const dk = dateKey(d);
              const isPast = d < today;
              const isToday = dk === dateKey(today);
              const hasSlots = slotDates.has(dk);
              const isSelected = dk === selectedDate;

              return (
                <button
                  key={dk}
                  onClick={() => !isPast && setSelectedDate(dk)}
                  disabled={isPast}
                  className={`relative mx-auto w-9 h-9 rounded-full text-sm font-medium flex items-center justify-center transition-colors
                    ${isSelected && hasSlots ? "bg-[#9b59c4] text-white" :
                      isSelected ? "bg-[#3A3A3A] text-white" :
                      hasSlots ? "bg-[#edd5f9] dark:bg-[#E2A9F1]/20 text-[#9b59c4] dark:text-[#E2A9F1] hover:bg-[#d9a8f5] dark:hover:bg-[#E2A9F1]/35" :
                      isToday ? "border-2 border-[#E2A9F1] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" :
                      isPast ? "text-gray-300 dark:text-gray-600 cursor-default" :
                      "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Statskort */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#edd5f9] dark:bg-[#E2A9F1]/10 rounded-2xl p-4">
            <p className="text-xs text-[#9b59c4] dark:text-[#E2A9F1] font-medium mb-1">Ledige tider</p>
            <p className="text-3xl font-bold text-[#9b59c4] dark:text-[#E2A9F1]">{freeCount}</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Privattimer hatt</p>
            <p className="text-3xl font-bold text-gray-700 dark:text-gray-200">{totalCompleted}</p>
          </div>
        </div>

        {/* Betalt-kort med progressbar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-4">
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Betalingsstatus</p>
            <p className="text-xs text-gray-400">{paidCount}/{totalCompleted}</p>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 mb-2">
            <div
              className="bg-green-400 dark:bg-green-500 h-2.5 rounded-full transition-all"
              style={{ width: totalCompleted > 0 ? `${(paidCount / totalCompleted) * 100}%` : "0%" }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span className="text-green-600 dark:text-green-400">{paidCount} betalt</span>
            {unpaidCount > 0 && <span className="text-amber-500">{unpaidCount} mangler betaling</span>}
          </div>
        </div>

        {/* Sesongmål-kort */}
        <Link href="/trainer/sesongmal" className="block bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-4 hover:border-[#E2A9F1] dark:hover:border-[#E2A9F1] transition-colors group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center">
                <Target size={16} className="text-[#9b59c4] dark:text-[#E2A9F1]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Sesongmål</p>
                <p className="text-xs text-gray-400">Se danserenes mål</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-[#E2A9F1] transition-colors" />
          </div>
        </Link>
      </div>

      {/* Høyre kolonne – timer for valgt dato */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 capitalize">
            {selectedLabel || "Velg en dato"}
          </h2>
          <Link href="/trainer/availability" className="text-sm font-medium text-[#9b59c4] dark:text-[#E2A9F1] hover:underline">
            + Legg ut tid
          </Link>
        </div>

        {selectedSlots.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-8 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {slotDates.has(selectedDate) ? "Laster…" : "Ingen tider lagt ut denne dagen"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedSlots.map(slot => {
              const start = new Date(slot.start_at);
              const end = new Date(slot.end_at);
              const booking = slot.bookings?.find(b => b.status === "confirmed");
              const dayLabelFull = selectedDateObj ? selectedDateObj.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" }) : "";

              return (
                <div key={slot.id} className={`bg-white dark:bg-gray-900 rounded-2xl border p-4 transition-colors ${
                  booking ? "border-l-4 border-l-[#E2A9F1] dark:border-gray-800" : "border-dashed border-gray-200 dark:border-gray-700"
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{formatTime(start)}–{formatTime(end)}</p>
                      {booking ? (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            {((booking.linked_profile as any)?.avatar_url || (booking.booker as any)?.avatar_url) ? (
                              <img src={(booking.linked_profile as any)?.avatar_url ?? (booking.booker as any)?.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center text-[#9b59c4] text-xs font-bold">
                                {booking.dancer_name.charAt(0)}
                              </div>
                            )}
                            <p className="text-sm font-medium text-[#9b59c4] dark:text-[#E2A9F1]">{booking.dancer_name} · {booking.dance_style}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <PaidToggle bookingId={booking.id} initialPaid={!!booking.paid} />
                            {!booking.paid && (
                              <KvitteringReminder booking={booking} when={`${dayLabelFull} kl ${formatTime(start)}`} trainerName={trainerName} trainerId={trainerId} />
                            )}
                            {end > new Date() && (
                              <Link href={`/trainer/avbestill/${booking.id}`} prefetch={false} className="text-xs text-red-400 hover:text-red-600">Avbestill</Link>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full">Ledig</span>
                          <Link href={`/trainer/slett-slot/${slot.id}`} prefetch={false} className="text-xs text-red-400 hover:text-red-600">Slett</Link>
                        </div>
                      )}
                    </div>
                    {booking && (
                      <span className="text-xs bg-[#edd5f9] dark:bg-[#E2A9F1]/15 text-[#9b59c4] dark:text-[#E2A9F1] px-2.5 py-1 rounded-full ml-3 whitespace-nowrap">Opptatt</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
