"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Check, ChevronLeft, ChevronRight, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { formatTime, formatDate, formatWeekday } from "@/lib/dateUtils";
import type { Locale } from "@/i18n/locale";

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
  const t = useTranslations("trainer");
  const tc = useTranslations("common");
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
      {paid ? <><Check size={12} strokeWidth={3} /> {tc("booking.paidLabel")}</> : t("markPaid")}
    </button>
  );
}

function KvitteringReminder({ booking, when, trainerName, trainerId }: { booking: { id: string; receipt_reminders_sent?: number; booker_id?: string; linked_user_id?: string | null }; when: string; trainerName: string; trainerId: string }) {
  const t = useTranslations("trainer");
  const [count, setCount] = useState(booking.receipt_reminders_sent ?? 0);
  const [sending, setSending] = useState(false);
  const ids = [...new Set([booking.booker_id, booking.linked_user_id])].filter((x): x is string => !!x && x !== trainerId);
  if (ids.length === 0) return null;

  async function send() {
    if (sending) return;
    if (count === 0 && !confirm(t("web.confirmReminder"))) return;
    setSending(true);
    // TODO(i18n): se tilsvarende TODO i TrainerDashboardTabs.tsx - rendres i
    // avsenderens språk inntil /api/notify slår opp mottakerens.
    const message = t("receiptReminder.notificationMessage", { when, trainerName });
    const supabase = createClient();
    await supabase.from("notifications").insert(ids.map(user_id => ({ user_id, message })));
    await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userIds: ids, title: t("receiptReminder.notificationTitle"), message }) }).catch(() => {});
    await supabase.from("bookings").update({ receipt_reminders_sent: count + 1 }).eq("id", booking.id);
    setCount(c => c + 1);
    setSending(false);
  }

  return (
    <button onClick={send} disabled={sending} className="text-xs text-[#9b59c4] dark:text-[#E2A9F1] hover:underline disabled:opacity-50">
      {sending ? t("receiptReminder.sending") : count === 0 ? t("receiptReminder.send") : t("web.reminderAgain", { count })}
    </button>
  );
}

export default function TrainerWebDashboard({ slots, completedSlots, trainerName, trainerId, freeCount }: Props) {
  const t = useTranslations("trainer");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
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

  const monthName = formatDate(firstDay, locale, { month: "long", year: "numeric" });

  // Slots for valgt dato
  const selectedSlots = slots.filter(s => dateKey(new Date(s.start_at)) === selectedDate).sort((a, b) => a.start_at.localeCompare(b.start_at));
  const selectedDateObj = selectedDate ? new Date(selectedDate + "T12:00:00") : null;
  const selectedLabel = selectedDateObj ? formatDate(selectedDateObj, locale, { weekday: "long", day: "numeric", month: "long" }) : "";

  // Ukedager for kalender-hodet, mandag først – lokalisert (ikke hardkodet norsk).
  // 1. jan 2024 var en mandag.
  const DAY_LABELS = Array.from({ length: 7 }, (_, i) => formatWeekday(new Date(2024, 0, 1 + i), locale, "short"));

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
            <p className="text-xs text-[#9b59c4] dark:text-[#E2A9F1] font-medium mb-1">{t("web.freeSlots")}</p>
            <p className="text-3xl font-bold text-[#9b59c4] dark:text-[#E2A9F1]">{freeCount}</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{t("web.lessonsHad")}</p>
            <p className="text-3xl font-bold text-gray-700 dark:text-gray-200">{totalCompleted}</p>
          </div>
        </div>

        {/* Betalt-kort med progressbar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-4">
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("web.paymentStatus")}</p>
            <p className="text-xs text-gray-400">{paidCount}/{totalCompleted}</p>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 mb-2">
            <div
              className="bg-green-400 dark:bg-green-500 h-2.5 rounded-full transition-all"
              style={{ width: totalCompleted > 0 ? `${(paidCount / totalCompleted) * 100}%` : "0%" }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span className="text-green-600 dark:text-green-400">{t("web.paidCount", { count: paidCount })}</span>
            {unpaidCount > 0 && <span className="text-amber-500">{t("web.missingPaymentCount", { count: unpaidCount })}</span>}
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
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("web.seasonGoals")}</p>
                <p className="text-xs text-gray-400">{t("web.seeSeasonGoals")}</p>
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
            {selectedLabel || t("web.selectDate")}
          </h2>
          <Link href="/trainer/availability" className="text-sm font-medium text-[#9b59c4] dark:text-[#E2A9F1] hover:underline">
            {t("postAvailability")}
          </Link>
        </div>

        {selectedSlots.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-8 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {slotDates.has(selectedDate) ? t("web.loadingSlots") : t("web.noSlotsThisDay")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedSlots.map(slot => {
              const start = new Date(slot.start_at);
              const end = new Date(slot.end_at);
              const booking = slot.bookings?.find(b => b.status === "confirmed");
              const dayLabelFull = selectedDateObj ? formatDate(selectedDateObj, locale, { weekday: "long", day: "numeric", month: "long" }) : "";

              return (
                <div key={slot.id} className={`bg-white dark:bg-gray-900 rounded-2xl border p-4 transition-colors ${
                  booking ? "border-l-4 border-l-[#E2A9F1] dark:border-gray-800" : "border-dashed border-gray-200 dark:border-gray-700"
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{formatTime(start, locale)}–{formatTime(end, locale)}</p>
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
                              <KvitteringReminder booking={booking} when={t("receiptReminder.atTime", { day: dayLabelFull, time: formatTime(start, locale) })} trainerName={trainerName} trainerId={trainerId} />
                            )}
                            {end > new Date() && (
                              <Link href={`/trainer/avbestill/${booking.id}`} prefetch={false} className="text-xs text-red-400 hover:text-red-600">{tc("booking.cancel")}</Link>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full">{t("free")}</span>
                          <Link href={`/trainer/slett-slot/${slot.id}`} prefetch={false} className="text-xs text-red-400 hover:text-red-600">{t("deleteSlot")}</Link>
                        </div>
                      )}
                    </div>
                    {booking && (
                      <span className="text-xs bg-[#edd5f9] dark:bg-[#E2A9F1]/15 text-[#9b59c4] dark:text-[#E2A9F1] px-2.5 py-1 rounded-full ml-3 whitespace-nowrap">{t("occupied")}</span>
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
