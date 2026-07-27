"use client";

import { useState } from "react";

type Profile = { id: string; name: string; role: string; created_at: string };
type Feedback = { id: string; user_name: string; role: string; message: string; created_at: string };
type Booking = {
  id: string;
  dancer_name: string;
  dance_style: string;
  status: string;
  availability_slots: { id: string; start_at: string; end_at: string; trainer_id: string } | null;
};
type Slot = { id: string; start_at: string; end_at: string; trainer_id: string };

interface Props {
  profiles: Profile[];
  feedback: Feedback[];
  bookings: Booking[];
  slots: Slot[];
  trainerMap: Record<string, string>;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} dag${days > 1 ? "er" : ""} siden`;
  if (hours > 0) return `${hours} time${hours > 1 ? "r" : ""} siden`;
  return `${mins} min siden`;
}

function formatDt(dateStr: string) {
  return new Date(dateStr).toLocaleString("nb-NO", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

type RoleFilter = "alle" | "dancer" | "parent" | "trainer";

export default function AdminClient({ profiles, feedback, bookings, slots, trainerMap }: Props) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter | null>(null);
  const [trainerOpen, setTrainerOpen] = useState<string | null>(null);

  const dancers = profiles.filter(p => p.role === "dancer");
  const parents = profiles.filter(p => p.role === "parent");
  const trainers = profiles.filter(p => p.role === "trainer");

  const filteredProfiles = roleFilter === "dancer" ? dancers
    : roleFilter === "parent" ? parents
    : roleFilter === "trainer" ? trainers
    : roleFilter === "alle" ? profiles
    : null;

  const statCards = [
    { label: "Alle brukere", value: profiles.length, filter: "alle" as RoleFilter },
    { label: "Dansere", value: dancers.length, filter: "dancer" as RoleFilter },
    { label: "Foreldre", value: parents.length, filter: "parent" as RoleFilter },
    { label: "Trenere", value: trainers.length, filter: "trainer" as RoleFilter },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Kun synlig for deg</p>
        </div>

        {/* Stat-bokser */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(card => (
            <button
              key={card.filter}
              onClick={() => setRoleFilter(roleFilter === card.filter ? null : card.filter)}
              className={`rounded-2xl border p-5 text-center transition-all ${roleFilter === card.filter ? "bg-purple-600 border-purple-600 text-white" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-purple-400"}`}
            >
              <p className={`text-3xl font-bold ${roleFilter === card.filter ? "text-white" : "text-gray-900 dark:text-white"}`}>{card.value}</p>
              <p className={`text-sm mt-1 ${roleFilter === card.filter ? "text-purple-100" : "text-gray-500 dark:text-gray-400"}`}>{card.label}</p>
            </button>
          ))}
        </div>

        {/* Brukerliste */}
        {filteredProfiles && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">
              {roleFilter === "alle" ? "Alle brukere" : roleFilter === "dancer" ? "Dansere" : roleFilter === "parent" ? "Foreldre" : "Trenere"}
              <span className="text-purple-600 ml-2">{filteredProfiles.length}</span>
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredProfiles.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-sm shrink-0">
                      {p.name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{p.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{p.role}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-2">{timeAgo(p.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Treneroversikt */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Treneroversikt</h2>
          <div className="space-y-3">
            {trainers.map(trainer => {
              const trainerBookings = bookings.filter(
                b => b.availability_slots?.trainer_id === trainer.id && b.status === "confirmed"
              );
              const trainerSlots = slots.filter(s => s.trainer_id === trainer.id);
              const isOpen = trainerOpen === trainer.id;

              return (
                <div key={trainer.id} className="border dark:border-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setTrainerOpen(isOpen ? null : trainer.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-sm shrink-0">
                        {trainer.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{trainer.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {trainerBookings.length} bookinger · {trainerSlots.length} ledige fremover
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm">{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen && (
                    <div className="border-t dark:border-gray-700 p-4 space-y-4">

                      {/* Bookede timer */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Bookede timer</p>
                        {trainerBookings.length === 0 ? (
                          <p className="text-sm text-gray-400 dark:text-gray-500">Ingen bookede timer</p>
                        ) : (
                          <div className="space-y-2">
                            {trainerBookings.map(b => (
                              <div key={b.id} className="flex items-center justify-between bg-purple-50 dark:bg-purple-950 rounded-xl px-3 py-2">
                                <div>
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                    {b.availability_slots ? formatDt(b.availability_slots.start_at) : "–"}
                                  </p>
                                  <p className="text-xs text-purple-600">{b.dancer_name} · {b.dance_style}</p>
                                </div>
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Booket</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Ledige tider */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Ledige tider fremover</p>
                        {trainerSlots.length === 0 ? (
                          <p className="text-sm text-gray-400 dark:text-gray-500">Ingen ledige tider lagt ut</p>
                        ) : (
                          <div className="space-y-1">
                            {trainerSlots.slice(0, 10).map(s => (
                              <div key={s.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                                <p className="text-sm text-gray-700 dark:text-gray-300">{formatDt(s.start_at)}</p>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">Ledig</span>
                              </div>
                            ))}
                            {trainerSlots.length > 10 && <p className="text-xs text-gray-400 pl-3">+ {trainerSlots.length - 10} til</p>}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tilbakemeldinger */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">
            Tilbakemeldinger <span className="text-purple-600 ml-1">{feedback.length}</span>
          </h2>
          {!feedback.length ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Ingen tilbakemeldinger ennå</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {feedback.map(f => (
                <div key={f.id} className="border dark:border-gray-700 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{f.user_name}</p>
                    <span className="text-xs text-gray-400">{timeAgo(f.created_at)}</span>
                  </div>
                  <span className="text-xs bg-purple-50 dark:bg-purple-950 text-purple-600 px-2 py-0.5 rounded-full">{f.role}</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{f.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
