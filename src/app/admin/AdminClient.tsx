"use client";

import { useState } from "react";

type Profile = { id: string; name: string; role: string; created_at: string };
type Feedback = { id: string; user_name: string; role: string; message: string; created_at: string };
type SlotBooking = { id: string; dancer_name: string; dance_style: string; status: string };
type Slot = { id: string; start_at: string; end_at: string; trainer_id: string; bookings?: SlotBooking[] };

interface Props {
  profiles: Profile[];
  feedback: Feedback[];
  bookings: Slot[];  // slots with bookings (alias)
  slots: Slot[];
  trainerMap: Record<string, string>;
}

const ROLE_COLORS = {
  dancer: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-300", label: "Danser" },
  parent: { bg: "bg-green-100 dark:bg-green-900", text: "text-green-700 dark:text-green-300", label: "Forelder" },
  trainer: { bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-700 dark:text-orange-300", label: "Trener" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} dag${days > 1 ? "er" : ""} siden`;
  if (hours > 0) return `${hours} time${hours > 1 ? "r" : ""} siden`;
  return `${mins} min siden`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const DAYS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
const MONTHS = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

type RoleFilter = "alle" | "dancer" | "parent" | "trainer";

function TrainerCalendar({ trainer, slots }: { trainer: Profile; slots: Slot[] }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const trainerSlots = slots.filter(s => s.trainer_id === trainer.id);
  const weekLabel = `${weekStart.getDate()}. ${MONTHS[weekStart.getMonth()]} – ${addDays(weekStart, 6).getDate()}. ${MONTHS[addDays(weekStart, 6).getMonth()]}`;

  const weekNav = (
    <div className="flex items-center justify-between mb-4">
      <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 font-bold">←</button>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{weekLabel}</p>
      <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 font-bold">→</button>
    </div>
  );

  const now = new Date();

  // Mobile: list view
  const listView = (
    <div className="md:hidden space-y-2">
      {weekDays.map((day, i) => {
        const daySlots = trainerSlots.filter(s => isSameDay(new Date(s.start_at), day));
        const isToday = isSameDay(day, new Date());
        if (daySlots.length === 0) return null;
        return (
          <div key={i}>
            <p className={`text-xs font-bold mb-1 ${isToday ? "text-[#E2A9F1]" : "text-gray-500 dark:text-gray-400"}`}>
              {DAYS[i]} {day.getDate()}. {MONTHS[day.getMonth()]}
            </p>
            <div className="space-y-1">
              {daySlots.map(s => {
                const booking = s.bookings?.find(b => b.status === "confirmed");
                const isPast = new Date(s.start_at) < now;
                return booking ? (
                  <div key={s.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${isPast ? "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 opacity-50" : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isPast ? "bg-gray-400" : "bg-green-500"}`} />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-10 shrink-0">{formatTime(s.start_at)}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">{booking.dancer_name} · {booking.dance_style}</span>
                    {isPast && <span className="text-[10px] text-gray-400 shrink-0">Gjennomført</span>}
                  </div>
                ) : (
                  <div key={s.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${isPast ? "opacity-30 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                    <span className="text-xs font-semibold text-gray-500 w-10 shrink-0">{formatTime(s.start_at)}</span>
                    <span className="text-xs text-gray-400">{isPast ? "Ikke booket" : "Ledig"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {weekDays.every(day => trainerSlots.filter(s => isSameDay(new Date(s.start_at), day)).length === 0) && (
        <p className="text-xs text-gray-400 text-center py-2">Ingen timer denne uken</p>
      )}
    </div>
  );

  // Desktop: grid view
  const gridView = (
    <div className="hidden md:block">
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 pb-1">{d}</div>
        ))}
        {weekDays.map((day, i) => {
          const daySlots = trainerSlots.filter(s => isSameDay(new Date(s.start_at), day));
          const isToday = isSameDay(day, new Date());
          return (
            <div key={i} className={`min-h-20 rounded-xl p-1.5 border ${isToday ? "border-purple-400 bg-[#f5eeff] dark:bg-[#E2A9F1]/10" : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"}`}>
              <p className={`text-xs font-bold mb-1 ${isToday ? "text-[#E2A9F1]" : "text-gray-500 dark:text-gray-400"}`}>{day.getDate()}</p>
              <div className="space-y-1">
                {daySlots.map(s => {
                  const booking = s.bookings?.find(b => b.status === "confirmed");
                  const isPast = new Date(s.start_at) < now;
                  return booking ? (
                    <div key={s.id} className={`rounded-md px-1 py-0.5 ${isPast ? "bg-gray-300 dark:bg-gray-600 opacity-50" : "bg-green-500 text-white"}`}>
                      <p className="text-[10px] font-semibold leading-tight">{formatTime(s.start_at)}</p>
                      <p className="text-[10px] leading-tight truncate">{booking.dancer_name}</p>
                    </div>
                  ) : (
                    <div key={s.id} className={`rounded-md px-1 py-0.5 ${isPast ? "opacity-25 bg-gray-200 dark:bg-gray-700" : "bg-gray-200 dark:bg-gray-700"}`}>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{formatTime(s.start_at)}</p>
                      <p className="text-[10px] text-gray-400 leading-tight">Ledig</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500" /><span className="text-xs text-gray-500">Kommende</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600" /><span className="text-xs text-gray-500">Gjennomført</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" /><span className="text-xs text-gray-500">Ledig</span></div>
      </div>
    </div>
  );

  return (
    <div className="border-t dark:border-gray-700 p-4">
      {weekNav}
      {listView}
      {gridView}
    </div>
  );
}

export default function AdminClient({ profiles, feedback, slots, trainerMap }: Props) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter | null>(null);
  const [trainerOpen, setTrainerOpen] = useState<string | null>(null);

  const dancers = profiles.filter(p => p.role === "dancer");
  const parents = profiles.filter(p => p.role === "parent");
  const trainers = profiles.filter(p => p.role === "trainer");

  const filteredProfiles = roleFilter === "dancer" ? dancers
    : roleFilter === "parent" ? parents
    : roleFilter === "trainer" ? trainers
    : null;

  const statCards = [
    { label: "Dansere", value: dancers.length, filter: "dancer" as RoleFilter, color: "bg-blue-500 border-blue-500" },
    { label: "Foreldre", value: parents.length, filter: "parent" as RoleFilter, color: "bg-green-500 border-green-500" },
    { label: "Trenere", value: trainers.length, filter: "trainer" as RoleFilter, color: "bg-orange-500 border-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 page-safe-top">
      <div className="max-w-5xl mx-auto space-y-8">

        <div className="flex items-center gap-4">
          <a href="/trainer/dashboard" className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400">
            ←
          </a>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Kun synlig for deg · <span className="font-medium">{profiles.length} brukere totalt</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Treneroversikt</h2>
          <div className="space-y-3">
            {trainers.map(trainer => {
              const trainerSlots = slots.filter(s => s.trainer_id === trainer.id);
              const bookedCount = trainerSlots.filter(s => s.bookings?.some(b => b.status === "confirmed")).length;
              const availableCount = trainerSlots.filter(s => !s.bookings?.some(b => b.status === "confirmed") && new Date(s.start_at) > new Date()).length;
              const isOpen = trainerOpen === trainer.id;

              return (
                <div key={trainer.id} className="border dark:border-gray-700 rounded-xl overflow-hidden">
                  <button onClick={() => setTrainerOpen(isOpen ? null : trainer.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-700 dark:text-orange-300 font-bold text-sm shrink-0">
                        {trainer.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{trainer.name}</p>
                        <p className="text-xs text-gray-400">{bookedCount} bookinger · {availableCount} ledige fremover</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm">{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && <TrainerCalendar trainer={trainer} slots={slots} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(card => (
            <button key={card.filter} onClick={() => setRoleFilter(roleFilter === card.filter ? null : card.filter)}
              className={`rounded-2xl border-2 p-5 text-center transition-all ${roleFilter === card.filter ? `${card.color} text-white` : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}>
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-sm mt-1 opacity-80">{card.label}</p>
            </button>
          ))}
        </div>

        {filteredProfiles && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 dark:text-white">
                {roleFilter === "alle" ? "Alle brukere" : roleFilter === "dancer" ? "Dansere" : roleFilter === "parent" ? "Foreldre" : "Trenere"}
                <span className="ml-2 text-gray-400 font-normal">{filteredProfiles.length}</span>
              </h2>
              <button onClick={() => setRoleFilter(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕ Lukk</button>
            </div>
            <div className="space-y-1">
              {filteredProfiles.map(p => {
                const colors = ROLE_COLORS[p.role as keyof typeof ROLE_COLORS];
                return (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${colors?.bg} flex items-center justify-center ${colors?.text} font-bold text-sm shrink-0`}>
                        {p.name?.charAt(0) ?? "?"}
                      </div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{p.name}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{timeAgo(p.created_at)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">
            Tilbakemeldinger <span className="text-[#E2A9F1] ml-1">{feedback.length}</span>
          </h2>
          {!feedback.length ? (
            <p className="text-sm text-gray-400">Ingen tilbakemeldinger ennå</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {feedback.map(f => {
                const colors = ROLE_COLORS[f.role as keyof typeof ROLE_COLORS];
                return (
                  <div key={f.id} className="border dark:border-gray-700 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{f.user_name}</p>
                      <span className="text-xs text-gray-400">{timeAgo(f.created_at)}</span>
                    </div>
                    {colors && <span className={`text-xs ${colors.text} ${colors.bg} px-2 py-0.5 rounded-full`}>{colors.label}</span>}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{f.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
