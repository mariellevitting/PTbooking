"use client";

import { useState } from "react";

type Profile = { id: string; name: string; role: string; created_at: string; club_id?: string };
type Feedback = { id: string; user_name: string; role: string; message: string; created_at: string };
type SlotBooking = { id: string; dancer_name: string; dance_style: string; status: string };
type Slot = { id: string; start_at: string; end_at: string; trainer_id: string; bookings?: SlotBooking[] };
type Club = { id: string; name: string; invite_code: string; trainer_code: string | null; dancer_code: string | null; parent_code: string | null; created_at: string };

interface Props {
  profiles: Profile[];
  feedback: Feedback[];
  bookings: Slot[];
  slots: Slot[];
  trainerMap: Record<string, string>;
  isAdmin: boolean;
  clubs: Club[];
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

export default function AdminClient({ profiles: initialProfiles, feedback, slots, trainerMap, isAdmin, clubs }: Props) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter | null>(null);
  const [trainerOpen, setTrainerOpen] = useState<string | null>(null);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [msgRole, setMsgRole] = useState<"all" | "trainer" | "dancer" | "parent">("all");
  const [msgClub, setMsgClub] = useState<string>("all");
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sentInfo, setSentInfo] = useState("");

  const msgRecipients = profiles.filter(p =>
    (msgRole === "all" || p.role === msgRole) &&
    (msgClub === "all" || p.club_id === msgClub)
  );

  async function sendBroadcast() {
    if (!msgBody.trim() || sending) return;
    const ids = msgRecipients.map(p => p.id);
    if (ids.length === 0) return;
    if (!confirm(`Sende melding til ${ids.length} bruker(e)?`)) return;
    setSending(true);
    setSentInfo("");
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const message = msgBody.trim();
    await supabase.from("notifications").insert(ids.map(user_id => ({ user_id, message })));
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: ids, title: msgTitle.trim() || "Danceitude", message }),
    }).catch(() => {});
    setSending(false);
    setSentInfo(`Sendt til ${ids.length} bruker(e)`);
    setMsgTitle("");
    setMsgBody("");
  }

  async function handleDeleteUser(id: string, name: string) {
    if (!confirm(`Slette «${name}» for godt? Bookinger, mål og resultater forsvinner også.`)) return;
    setDeletingId(id);
    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    setDeletingId(null);
    if (res.ok) {
      setProfiles(prev => prev.filter(p => p.id !== id));
    } else {
      const { error } = await res.json().catch(() => ({ error: "Ukjent feil" }));
      alert(`Kunne ikke slette: ${error}`);
    }
  }

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
          <a href="/trainer/dashboard" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </a>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Kun synlig for trenere · <span className="font-medium">{profiles.length} brukere totalt</span></p>
          </div>
        </div>

        {/* KLUBBER — kun synlig for admin */}
        {isAdmin && <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Klubber</h2>
          <div className="space-y-3">
            {clubs.map(club => {
              const members = profiles.filter(p => p.club_id === club.id);
              const trainersInClub = members.filter(p => p.role === "trainer");
              const dancersInClub = members.filter(p => p.role === "dancer");
              const parentsInClub = members.filter(p => p.role === "parent");
              return (
                <div key={club.id} className="border dark:border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white">{club.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{members.length} medlemmer</span>
                      <a href={`/admin/klubb/${club.id}`} className="text-xs font-semibold text-[#9b59c4] dark:text-[#E2A9F1] hover:underline">
                        Rediger innstillinger →
                      </a>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-orange-600">{trainersInClub.length}</p>
                      <p className="text-xs text-gray-500">Trenere</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-blue-600">{dancersInClub.length}</p>
                      <p className="text-xs text-gray-500">Dansere</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-green-600">{parentsInClub.length}</p>
                      <p className="text-xs text-gray-500">Foreldre</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Klubbkoder</p>
                    {club.trainer_code && <div className="flex justify-between text-sm"><span className="text-gray-500">Trener</span><span className="font-mono font-bold text-gray-900 dark:text-white">{club.trainer_code}</span></div>}
                    {club.dancer_code && <div className="flex justify-between text-sm"><span className="text-gray-500">Danser</span><span className="font-mono font-bold text-gray-900 dark:text-white">{club.dancer_code}</span></div>}
                    {club.parent_code && <div className="flex justify-between text-sm"><span className="text-gray-500">Forelder</span><span className="font-mono font-bold text-gray-900 dark:text-white">{club.parent_code}</span></div>}
                    {!club.trainer_code && !club.dancer_code && !club.parent_code && (
                      <p className="text-xs text-gray-400">Bruker env-variabler (Evolution)</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>}

        {/* SEND MELDING — kun admin */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-1">Send melding</h2>
            <p className="text-xs text-gray-400 mb-4">Varsel i appen + push til valgte brukere</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <select value={msgRole} onChange={e => setMsgRole(e.target.value as any)} className="border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                <option value="all">Alle roller</option>
                <option value="trainer">Trenere</option>
                <option value="dancer">Dansere</option>
                <option value="parent">Foreldre</option>
              </select>
              <select value={msgClub} onChange={e => setMsgClub(e.target.value)} className="border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                <option value="all">Alle klubber</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <input value={msgTitle} onChange={e => setMsgTitle(e.target.value)} placeholder="Tittel (valgfritt)" className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-2" />
            <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={3} placeholder="Meldingstekst…" className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-3" />
            <div className="flex items-center gap-3">
              <button onClick={sendBroadcast} disabled={sending || !msgBody.trim() || msgRecipients.length === 0}
                className="bg-[#3A3A3A] hover:bg-[#2a2a2a] text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
                {sending ? "Sender…" : `Send til ${msgRecipients.length}`}
              </button>
              {sentInfo && <span className="text-sm text-green-600 dark:text-green-400">{sentInfo}</span>}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Treneroversikt</h2>
          <div className="space-y-3">
            {trainers.map(trainer => {
              const trainerSlots = slots.filter(s => s.trainer_id === trainer.id);
              const bookedCount = trainerSlots.reduce((sum, s) => sum + (s.bookings?.filter(b => b.status === "confirmed").length ?? 0), 0);
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
                        <p className="text-xs text-gray-400">{bookedCount} bookinger · {availableCount} ledige fremover{isAdmin && trainer.club_id ? ` · ${clubs.find(c => c.id === trainer.club_id)?.name ?? ""}` : ""}</p>
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
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{p.name}</p>
                        {isAdmin && p.club_id && <p className="text-xs text-gray-400">{clubs.find(c => c.id === p.club_id)?.name ?? "Ukjent klubb"}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-xs text-gray-400">{timeAgo(p.created_at)}</span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteUser(p.id, p.name)}
                          disabled={deletingId === p.id}
                          className="text-xs text-gray-300 hover:text-red-500 disabled:opacity-40"
                          title="Slett bruker"
                        >
                          {deletingId === p.id ? "…" : "Slett"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isAdmin && (
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
        )}

      </div>
    </div>
  );
}
