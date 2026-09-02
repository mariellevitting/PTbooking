"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatTime, formatDateKey } from "@/lib/dateUtils";

interface Booking {
  id: string;
  dancer_name: string;
  dance_style: string;
  status: string;
  paid?: boolean;
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
  bookings?: { id: string; dancer_name: string; dance_style: string; status: string; paid?: boolean; booker_id?: string; linked_user_id?: string | null }[];
}

function KvitteringReminder({ booking, when, trainerName }: { booking: { id: string; booker_id?: string; linked_user_id?: string | null }; when: string; trainerName: string }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function send() {
    if (sending || sent || !booking.booker_id) return;
    setSending(true);
    const ids = [booking.booker_id, booking.linked_user_id].filter((x): x is string => !!x);
    const message = `Husk å sende bilde av kvittering for privattimen ${when} til ${trainerName}.`;
    await createClient().from("notifications").insert(ids.map(user_id => ({ user_id, message })));
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: ids, title: "Kvittering", message }),
    }).catch(() => {});
    setSending(false);
    setSent(true);
  }

  return (
    <button
      onClick={send}
      disabled={sending || sent}
      className="text-xs text-[#9b59c4] dark:text-[#E2A9F1] hover:underline disabled:opacity-50 disabled:no-underline"
    >
      {sent ? "Påminnelse sendt ✓" : sending ? "Sender…" : "Purr på kvittering"}
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
  slots: Slot[];
  completedSlots: CompletedSlot[];
  dancerProfiles?: unknown[];
  trainerName: string;
}

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function TrainerDashboardTabs({ slots, completedSlots, trainerName }: Props) {
  const [tab, setTab] = useState<"upcoming" | "completed">("upcoming");
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);

  const completedAll = completedSlots.filter(slot =>
    slot.bookings?.some(b => b.status === "confirmed")
  );
  const unpaidCount = completedAll.filter(s => s.bookings?.some(b => b.status === "confirmed" && !b.paid)).length;
  const completed = onlyUnpaid
    ? completedAll.filter(s => s.bookings?.some(b => b.status === "confirmed" && !b.paid))
    : completedAll;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-3">
        <button onClick={() => setTab("upcoming")} className={`flex-1 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "upcoming" ? "bg-white dark:bg-gray-900 text-[#c87de0] shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>Kommende</button>
        <button onClick={() => setTab("completed")} className={`flex-1 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "completed" ? "bg-white dark:bg-gray-900 text-[#c87de0] shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>Fullførte</button>
      </div>

      {/* Legg ut tid-knapp */}
      {<Link href="/trainer/availability" className="block mb-4">
        <Button className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a]">+ Legg ut tid</Button>
      </Link>}

      {/* Kommende timer */}
      {tab === "upcoming" && (() => {
        if (!slots || slots.length === 0) {
          return (
            <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5 text-center text-gray-400 dark:text-gray-500">
              <p className="font-medium">Ingen tider lagt ut</p>
              <p className="text-sm mt-1">Legg ut ledige tider så dansere kan booke deg</p>
            </div>
          );
        }

        const grouped: Record<string, typeof slots> = {};
        for (const slot of slots) {
          const key = formatDateKey(new Date(slot.start_at));
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(slot);
        }
        const weekGroups: Record<number, string[]> = {};
        for (const dateKey of Object.keys(grouped).sort()) {
          const week = getWeekNumber(new Date(dateKey));
          if (!weekGroups[week]) weekGroups[week] = [];
          weekGroups[week].push(dateKey);
        }

        return (
          <div className="space-y-6">
            {Object.entries(weekGroups).map(([week, dateKeys]) => (
              <div key={week}>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Uke {week}</p>
                <div className="space-y-4">
                  {dateKeys.sort().map((dateKey) => {
                    const daySlots = grouped[dateKey];
                    const dayLabel = formatDate(new Date(dateKey), { weekday: "long", day: "numeric", month: "long" });
                    return (
                      <div key={dateKey}>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 border-b dark:border-gray-700 pb-1">
                          {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
                        </p>
                        <div className="space-y-2">
                          {daySlots.map((slot) => {
                            const start = new Date(slot.start_at);
                            const end = new Date(slot.end_at);
                            const booking = slot.bookings?.find(b => b.status === "confirmed");
                            return (
                              <div key={slot.id} className={`rounded-xl border p-4 flex justify-between items-center ${booking ? "bg-white dark:bg-gray-900 border-l-4 border-l-[#E2A9F1]" : "bg-gray-50 dark:bg-gray-950 border-dashed border-gray-200 dark:border-gray-700"}`}>
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatTime(start)}–{formatTime(end)}</p>
                                  {booking && (
                                    <>
                                      <div className="flex items-center gap-2 mt-1">
                                        {((booking.linked_profile as any)?.avatar_url || (booking.booker as any)?.avatar_url) ? (
                                          <img src={(booking.linked_profile as any)?.avatar_url ?? (booking.booker as any)?.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                                        ) : (
                                          <div className="w-6 h-6 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center text-[#E2A9F1] text-xs font-bold">
                                            {booking.dancer_name.charAt(0)}
                                          </div>
                                        )}
                                        <p className="text-sm font-medium text-[#c87de0]">{booking.dancer_name} · {booking.dance_style}</p>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                        <PaidToggle bookingId={booking.id} initialPaid={!!booking.paid} />
                                        {!booking.paid && (
                                          <KvitteringReminder booking={booking} when={`${dayLabel} kl ${formatTime(start)}`} trainerName={trainerName} />
                                        )}
                                        {end > new Date() && (
                                          <Link href={`/trainer/avbestill/${booking.id}`} prefetch={false} className="text-xs text-red-400 hover:text-red-600">Avbestill</Link>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                                {booking ? (
                                  <span className="text-xs bg-[#edd5f9] dark:bg-[#E2A9F1]/15 text-[#c87de0] px-2 py-1 rounded-full whitespace-nowrap">Opptatt</span>
                                ) : (
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Ledig</span>
                                    <Link href={`/trainer/slett-slot/${slot.id}`} prefetch={false} className="text-xs text-red-400 hover:text-red-600">Slett</Link>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Gjennomførte timer */}
      {tab === "completed" && (() => {
        return (
          <>
            {completedAll.length > 0 && (
              <button
                onClick={() => setOnlyUnpaid(v => !v)}
                className={`mb-3 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  onlyUnpaid
                    ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                    : "bg-white text-gray-500 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700"
                }`}
              >
                {onlyUnpaid ? "Viser kun ubetalte" : `Vis kun ubetalte${unpaidCount ? ` (${unpaidCount})` : ""}`}
              </button>
            )}
            {(() => {
        if (completed.length === 0) {
          return (
            <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5 text-center text-gray-400 dark:text-gray-500">
              <p className="font-medium">{onlyUnpaid ? "Alt er betalt 🎉" : "Ingen gjennomførte timer ennå"}</p>
            </div>
          );
        }

        const monthGroups: Record<string, typeof completed> = {};
        for (const slot of completed) {
          const d = new Date(slot.start_at);
          const key = formatDate(d, { month: "long", year: "numeric" });
          if (!monthGroups[key]) monthGroups[key] = [];
          monthGroups[key].push(slot);
        }

        return (
          <div className="space-y-6">
            <p className="text-xs text-[#E2A9F1]">{completed.length} gjennomførte privattimer totalt</p>
            {Object.entries(monthGroups).map(([month, monthSlots]) => (
              <div key={month}>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{month}</p>
                <div className="space-y-2">
                  {monthSlots.map((slot) => {
                    const start = new Date(slot.start_at);
                    const end = new Date(slot.end_at);
                    const booking = slot.bookings?.find(b => b.status === "confirmed");
                    const dayLabel = formatDate(start, { weekday: "long", day: "numeric", month: "long" });
                    return (
                      <div key={slot.id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4 opacity-80">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">{formatTime(start)}–{formatTime(end)}</p>
                            {booking && <p className="text-sm text-[#E2A9F1] mt-0.5">{booking.dancer_name} · {booking.dance_style}</p>}
                            {booking && (
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <PaidToggle bookingId={booking.id} initialPaid={!!(booking as any).paid} />
                                {!(booking as any).paid && (
                                  <KvitteringReminder booking={booking as any} when={`${dayLabel} kl ${formatTime(start)}`} trainerName={trainerName} />
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full">Fullført</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
            })()}
          </>
        );
      })()}
    </div>
  );
}
