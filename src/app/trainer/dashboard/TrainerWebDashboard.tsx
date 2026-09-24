"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Target, Clock, Calendar, History, UserPlus } from "lucide-react";
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
  greetingText: string;
}

function dk(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (h < 1) return "Nå nettopp";
  if (h < 24) return `${h}t siden`;
  if (d < 7) return `${d}d siden`;
  return date.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
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
    <button onClick={toggle} disabled={saving}
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ${
        paid ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
             : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200"
      }`}>
      {paid ? <><Check size={12} strokeWidth={3} /> Betalt</> : "Marker som betalt"}
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
    <button onClick={send} disabled={sending}
      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 hover:bg-amber-100 disabled:opacity-50">
      {sending ? "Sender…" : count === 0 ? "Purr på kvittering" : `Purr igjen (${count})`}
    </button>
  );
}

const DAY_LABELS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

export default function TrainerWebDashboard({ slots, completedSlots, trainerName, trainerId, freeCount, greetingText }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Vis dagen med neste bookede privattime automatisk, ikke bare "i dag" (som
  // ofte er tom) — treneren skal slippe å klikke seg fram til riktig dag selv.
  const initialSelectedDate = (() => {
    const upcomingBooked = slots
      .filter(s => s.is_booked && new Date(s.start_at) >= today)
      .sort((a, b) => a.start_at.localeCompare(b.start_at));
    return upcomingBooked[0] ? dk(new Date(upcomingBooked[0].start_at)) : dk(today);
  })();

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(initialSelectedDate + "T12:00:00");
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => initialSelectedDate);

  const slotDates = new Set(slots.map(s => dk(new Date(s.start_at))));

  // 7-dagers statistikk (stabile verdier — ikke avhengig av Date.now() i render)
  const confirmedCompleted = completedSlots.filter(s => s.bookings?.some(b => b.status === "confirmed"));
  const nowTs = today.getTime(); // midnatt i dag, stabil mellom server/klient
  const sevenDaysAgoTs = nowTs - 7 * 86400000;
  const fourteenDaysAgoTs = nowTs - 14 * 86400000;
  const last7 = confirmedCompleted.filter(s => new Date(s.end_at).getTime() >= sevenDaysAgoTs);
  const prev7 = confirmedCompleted.filter(s => { const t = new Date(s.end_at).getTime(); return t >= fourteenDaysAgoTs && t < sevenDaysAgoTs; });
  const last7Hours = +(last7.length * 0.5).toFixed(1);
  const changePercent = prev7.length === 0 ? null : Math.round(((last7.length - prev7.length) / prev7.length) * 100);

  // Nylige aktiviteter (siste 5 gjennomførte) — null-safe
  const recentActivity = confirmedCompleted.slice(0, 5).map(s => {
    const b = s.bookings?.find(b => b.status === "confirmed");
    if (!b) return null;
    return { name: b.dancer_name, paid: !!b.paid, date: new Date(s.end_at) };
  }).filter((x): x is { name: string; paid: boolean; date: Date } => x !== null);

  // Kalender
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = firstDay.toLocaleDateString("nb-NO", { month: "long", year: "numeric" });

  // Valgt dato
  const selectedSlots = slots.filter(s => dk(new Date(s.start_at)) === selectedDate).sort((a, b) => a.start_at.localeCompare(b.start_at));
  const selectedDateObj = new Date(selectedDate + "T12:00:00");
  const selectedLabel = selectedDateObj.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" });

  // Hero dato
  const todayLabel = today.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();

  // Totalt betalt/ubetalt
  const paidCount = confirmedCompleted.filter(s => s.bookings?.some(b => b.status === "confirmed" && b.paid)).length;
  const totalCompleted = confirmedCompleted.length;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative h-44 rounded-2xl overflow-hidden">
        <img src="/login-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
        <div className="relative z-10 p-7 h-full flex flex-col justify-end">
          <p className="text-white/70 text-xs font-semibold tracking-widest uppercase mb-1">{todayLabel}</p>
          <h1 className="text-3xl font-bold text-white">{greetingText}, {trainerName.split(" ")[0]}! 👋</h1>
        </div>
      </div>

      {/* Rad 1: Kalender | Dag-visning (viktigst) */}
      <div className="grid grid-cols-[300px_1fr] gap-4">

        {/* Venstre: Kalender */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 capitalize">{monthName}</span>
              <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {DAY_LABELS.map(d => <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {Array.from({ length: startDow }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = new Date(year, month, i + 1);
                const key = dk(d);
                const isPast = d < today;
                const isToday = key === dk(today);
                const hasSlots = slotDates.has(key);
                const isSel = key === selectedDate;
                return (
                  <button key={key} onClick={() => !isPast && setSelectedDate(key)} disabled={isPast}
                    className={`mx-auto w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center transition-colors
                      ${isSel && hasSlots ? "bg-[#9b59c4] text-white" :
                        isSel ? "bg-[#3A3A3A] dark:bg-gray-600 text-white" :
                        hasSlots ? "bg-[#edd5f9] dark:bg-[#E2A9F1]/20 text-[#9b59c4] dark:text-[#E2A9F1] hover:bg-[#d9a8f5]" :
                        isToday ? "border-2 border-[#E2A9F1] text-gray-700 dark:text-gray-200" :
                        isPast ? "text-gray-300 dark:text-gray-600 cursor-default" :
                        "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hurtighandlinger */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Hurtighandlinger</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/trainer/availability", icon: <Calendar size={16} />, label: "Legg ut tid" },
                { href: "/trainer/book-for-dancer", icon: <UserPlus size={16} />, label: "Book for danser" },
                { href: "/trainer/historikk", icon: <History size={16} />, label: "Se historikk" },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-[#edd5f9]/50 dark:hover:bg-[#E2A9F1]/10 transition-colors text-center group">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-[#9b59c4] dark:text-[#E2A9F1] shadow-sm">
                    {a.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Midtre: Dag-visning */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 capitalize">{selectedLabel}</h2>
            <Link href="/trainer/availability" className="text-sm font-medium text-[#9b59c4] dark:text-[#E2A9F1] hover:underline">+ Legg ut tid</Link>
          </div>
          {selectedSlots.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-8 text-center">
              <p className="text-gray-400 dark:text-gray-500 text-sm">Ingen tider lagt ut denne dagen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedSlots.map(slot => {
                const start = new Date(slot.start_at);
                const end = new Date(slot.end_at);
                const booking = slot.bookings?.find(b => b.status === "confirmed");
                const dayFull = selectedDateObj.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" });
                return (
                  <div key={slot.id} className={`bg-white dark:bg-gray-900 rounded-2xl border p-4 ${booking ? "border-l-4 border-l-[#E2A9F1] dark:border-gray-700" : "border-dashed border-gray-200 dark:border-gray-700"}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatTime(start)} – {formatTime(end)}</p>
                        {booking ? (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              {((booking.linked_profile as any)?.avatar_url || (booking.booker as any)?.avatar_url) ? (
                                <img src={(booking.linked_profile as any)?.avatar_url ?? (booking.booker as any)?.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-[#edd5f9] flex items-center justify-center text-[#9b59c4] text-xs font-bold">
                                  {booking.dancer_name.charAt(0)}
                                </div>
                              )}
                              <p className="text-sm font-medium text-[#9b59c4] dark:text-[#E2A9F1]">{booking.dancer_name} · {booking.dance_style}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <PaidToggle bookingId={booking.id} initialPaid={!!booking.paid} />
                              {!booking.paid && <KvitteringReminder booking={booking} when={`${dayFull} kl ${formatTime(start)}`} trainerName={trainerName} trainerId={trainerId} />}
                              {mounted && end > new Date() && <Link href={`/trainer/avbestill/${booking.id}`} prefetch={false} className="text-xs text-red-400 hover:text-red-600">Avbestill</Link>}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full">Ledig</span>
                            <Link href={`/trainer/slett-slot/${slot.id}`} prefetch={false} className="text-xs text-red-400 hover:text-red-600">Slett</Link>
                          </div>
                        )}
                      </div>
                      {booking && <span className="text-xs bg-[#edd5f9] dark:bg-[#E2A9F1]/15 text-[#9b59c4] dark:text-[#E2A9F1] px-2.5 py-1 rounded-full ml-3 whitespace-nowrap">Opptatt</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Rad 2: Stats */}
      <div className="grid grid-cols-3 gap-4">
        {/* Siste 7 dager */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-5">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Siste 7 dager</p>
          <div className="flex gap-5">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Calendar size={13} className="text-[#9b59c4]" />
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{last7.length}</p>
              </div>
              <p className="text-xs text-gray-400">timer hatt</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock size={13} className="text-[#9b59c4]" />
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{last7Hours}</p>
              </div>
              <p className="text-xs text-gray-400">timer totalt</p>
            </div>
          </div>
        </div>

        {/* Betalingsstatus */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-5">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Betalingsstatus</p>
          <div className="flex items-end justify-between mb-2">
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{paidCount}<span className="text-base font-normal text-gray-400">/{totalCompleted}</span></p>
            <p className="text-xs text-gray-400 mb-1">betalt</p>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
            <div className="bg-green-400 h-2 rounded-full transition-all" style={{ width: totalCompleted > 0 ? `${(paidCount / totalCompleted) * 100}%` : "0%" }} />
          </div>
          {totalCompleted - paidCount > 0 && (
            <p className="text-xs text-amber-500 mt-2">{totalCompleted - paidCount} mangler betaling</p>
          )}
        </div>

        {/* Sesongmål */}
        <Link href="/trainer/sesongmal" className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-5 hover:border-[#E2A9F1] transition-colors group flex flex-col justify-between">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Sesongmål</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center">
                <Target size={18} className="text-[#9b59c4] dark:text-[#E2A9F1]" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Se danserenes mål og fremgang</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-[#E2A9F1] transition-colors flex-shrink-0" />
          </div>
        </Link>
      </div>

      {/* Rad 3: Nylige aktiviteter + Ledige tider */}
      <div className="grid grid-cols-[1fr_200px] gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-5">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">Nylige aktiviteter</p>
          {recentActivity.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Ingen aktivitet ennå</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center text-[#9b59c4] dark:text-[#E2A9F1] text-xs font-bold flex-shrink-0">
                    {a.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.paid ? "Betaling mottatt" : "Time gjennomført"}</p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">{mounted ? timeAgo(a.date) : ""}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#edd5f9] dark:bg-[#E2A9F1]/10 rounded-2xl p-5 flex flex-col justify-center">
          <p className="text-xs font-semibold text-[#9b59c4] dark:text-[#E2A9F1] uppercase tracking-wide mb-1">Ledige tider</p>
          <p className="text-4xl font-bold text-[#9b59c4] dark:text-[#E2A9F1]">{freeCount}</p>
          <p className="text-xs text-[#9b59c4]/70 dark:text-[#E2A9F1]/70 mt-1">tilgjengelige fremover</p>
        </div>
      </div>
    </div>
  );
}
