"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Calendar, Trophy, Medal, Star, Info, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import NMCountdown from "@/components/NMCountdown";
import ChildDancerCard from "@/app/parent/profil/ChildDancerCard";
import { formatDate, formatTime, formatDateKey } from "@/lib/dateUtils";

const COMPETITIONS = [
  { short: "NM 2026", date: new Date("2026-06-13"), dateLabel: "13–14. juni", location: "Sofiemyrhallen, Sofienmyr" },
  { short: "FDJ 6", date: new Date("2026-08-22"), dateLabel: "22. august", location: "Gausdal Arena, Lillehammer" },
  { short: "FDJ 7", date: new Date("2026-09-19"), dateLabel: "19. september", location: null },
  { short: "FDJ 8", date: new Date("2026-10-17"), dateLabel: "17. oktober", location: "Fjellhamar Arena, Lørenskog" },
  { short: "DOTY / FDJ 9", date: new Date("2026-11-21"), dateLabel: "21. november", location: null },
];

const sections = [
  { id: "timer", label: "Mine privattimer", icon: <Calendar size={15} /> },
  { id: "nivaer", label: "Poeng og nivåer", icon: <Trophy size={15} /> },
  { id: "resultater", label: "Resultater", icon: <Medal size={15} /> },
  { id: "konkurranser", label: "Konkurranser", icon: <Star size={15} /> },
  { id: "om", label: "Om privattimer", icon: <Info size={15} /> },
];

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function daysUntil(date: Date) {
  return Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

interface Booking {
  id: string;
  dancer_name: string;
  dance_style: string;
  availability_slots: {
    start_at: string;
    end_at: string;
    profiles?: { name?: string } | null;
  };
}

interface Props {
  userName: string;
  avatarUrl: string | null;
  notifications: any[];
  upcomingBookings: Booking[];
  completedBookings: Booking[];
  parentId: string;
  children: { id: string; name: string; season_goals: string | null; points_freestyle: number | null; points_slow: number | null; level_freestyle: number | null; level_slow: number | null }[];
}

export default function ParentDashboardNav({ userName, avatarUrl, notifications, upcomingBookings, completedBookings, parentId, children }: Props) {
  const [active, setActive] = useState("timer");
  const [bookingTab, setBookingTab] = useState<"kommende" | "gjennomforte">("kommende");
  const [menuOpen, setMenuOpen] = useState(false);

  function goTo(id: string) { setActive(id); setMenuOpen(false); }

  const grouped: Record<string, Booking[]> = {};
  for (const b of upcomingBookings) {
    const key = formatDateKey(new Date(b.availability_slots.start_at));
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  }
  const weekGroups: Record<number, string[]> = {};
  for (const dateKey of Object.keys(grouped).sort()) {
    const week = getWeekNumber(new Date(dateKey));
    if (!weekGroups[week]) weekGroups[week] = [];
    weekGroups[week].push(dateKey);
  }

  const upcomingComps = COMPETITIONS.filter(c => daysUntil(c.date) > 0);

  const Sidebar = () => (
    <>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                {userName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{userName.split(" ")[0]}</p>
              <p className="text-xs text-gray-400">Forelder</p>
            </div>
          </div>
          <NotificationBell notifications={notifications} />
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sections.map(s => (
          <button key={s.id} onClick={() => goTo(s.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${active === s.id ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            <span className={active === s.id ? "text-white" : "text-gray-400"}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <LogoutButton />
      </div>
    </>
  );

  return (
    <>
      {/* Mobil: lilla topbar */}
      <div className="md:hidden sticky top-0 z-40 bg-purple-600 px-4 py-3 flex items-center justify-between shadow-md">
        <button onClick={() => setMenuOpen(true)} className="p-1.5 rounded-lg hover:bg-purple-700 transition-colors">
          <Menu size={24} className="text-white" />
        </button>
        <p className="text-white font-semibold text-sm">PT Booking</p>
        <div className="flex items-center gap-2">
          <div className="[&_button]:text-white [&_svg]:text-white [&_span]:bg-white [&_span]:text-purple-600">
            <NotificationBell notifications={notifications} />
          </div>
          <Link href="/parent/profil" className="hover:opacity-80 transition-opacity">
            {avatarUrl
              ? <img src={avatarUrl} alt="Profil" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
              : <UserCircle size={28} className="text-white" />}
          </Link>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-gray-200 z-30">
        <Sidebar />
      </aside>

      {/* Mobil: slide-in drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex justify-end p-4">
              <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <Link href="/parent/profil" onClick={() => setMenuOpen(false)} className="px-6 pb-6 flex items-center gap-4 border-b hover:bg-gray-50 transition-colors">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl
                  ? <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-purple-600">{userName.charAt(0)}</span>}
              </div>
              <div>
                <p className="font-bold text-gray-800">{userName}</p>
                <p className="text-xs text-purple-500">Se profil →</p>
              </div>
            </Link>
            <div className="flex-1 py-4 overflow-y-auto">
              {sections.map(s => (
                <button key={s.id} onClick={() => goTo(s.id)}
                  className={`w-full flex items-center gap-4 px-6 py-3.5 text-sm font-medium transition-colors ${active === s.id ? "bg-purple-50 text-purple-700 border-r-4 border-purple-600" : "text-gray-600 hover:bg-gray-50"}`}>
                  <span className={active === s.id ? "text-purple-600" : "text-gray-400"}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="border-t px-6 py-4 text-sm text-gray-400">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}

      {/* Innhold */}
      <div className="md:ml-56">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

          <h1 className="text-2xl font-bold hidden md:block">Heihei, {userName.split(" ")[0]}! 👋</h1>

          <NMCountdown />

          {/* Mine privattimer */}
          {active === "timer" && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-lg">Mine privattimer</h2>
                <Link href="/book">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-sm">+ Book time</Button>
                </Link>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
                <button onClick={() => setBookingTab("kommende")}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${bookingTab === "kommende" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500"}`}>
                  Kommende
                </button>
                <button onClick={() => setBookingTab("gjennomforte")}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${bookingTab === "gjennomforte" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500"}`}>
                  Gjennomførte
                </button>
              </div>

              {bookingTab === "kommende" && (
                upcomingBookings.length === 0 ? (
                  <div className="bg-white rounded-xl border p-6 text-center text-gray-400">
                    <p className="text-lg font-medium mb-2">Ingen kommende timer</p>
                    <p className="text-sm mb-4">Book privattime for ditt barn</p>
                    <Link href="/book"><Button className="bg-purple-600 hover:bg-purple-700">Book privattime</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(weekGroups).map(([week, dateKeys]) => (
                      <div key={week}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Uke {week}</p>
                        <div className="space-y-4">
                          {dateKeys.sort().map(dateKey => {
                            const dayBookings = grouped[dateKey];
                            const dayLabel = formatDate(new Date(dateKey), { weekday: "long", day: "numeric", month: "long" });
                            return (
                              <div key={dateKey}>
                                <p className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</p>
                                <div className="space-y-2">
                                  {dayBookings.map(booking => {
                                    const start = new Date(booking.availability_slots.start_at);
                                    const end = new Date(booking.availability_slots.end_at);
                                    const hoursUntil = (start.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                                    return (
                                      <div key={booking.id} className="bg-white rounded-xl border border-l-4 border-l-purple-400 px-4 py-3">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="text-sm font-semibold text-gray-700">{formatTime(start)}–{formatTime(end)}</p>
                                            <p className="text-sm font-medium text-purple-600">{booking.dancer_name} · {booking.dance_style}</p>
                                            {(booking.availability_slots as any)?.profiles?.name && (
                                              <p className="text-xs font-medium text-gray-500">Trener: {(booking.availability_slots as any).profiles.name}</p>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Bekreftet</span>
                                            <Link href={`/booking/avbestill/${booking.id}`}>
                                              <button className="text-xs text-red-400 hover:text-red-600">Avbestill</button>
                                            </Link>
                                          </div>
                                        </div>
                                        {hoursUntil < 24 && <p className="text-xs text-red-400 mt-1">Under 24t – gebyr ved avbestilling</p>}
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
                )
              )}

              {bookingTab === "gjennomforte" && (
                completedBookings.length === 0 ? (
                  <div className="bg-white rounded-xl border p-6 text-center text-gray-400 text-sm">Ingen gjennomførte timer ennå</div>
                ) : (
                  <div className="space-y-2">
                    {completedBookings.map(booking => {
                      const start = new Date(booking.availability_slots.start_at);
                      const end = new Date(booking.availability_slots.end_at);
                      const dayLabel = formatDate(start, { weekday: "long", day: "numeric", month: "long" });
                      return (
                        <div key={booking.id} className="bg-white rounded-xl border p-4 opacity-60">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-semibold text-gray-500">{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</p>
                              <p className="text-sm text-gray-400">{formatTime(start)}–{formatTime(end)}</p>
                              <p className="text-sm text-gray-400 mt-1">{booking.dancer_name} · {booking.dance_style}</p>
                              {(booking.availability_slots as any)?.profiles?.name && (
                                <p className="text-xs text-gray-400 mt-0.5">Trener: {(booking.availability_slots as any).profiles.name}</p>
                              )}
                            </div>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Fullført</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}

          {/* Poeng og nivåer + Resultater */}
          {(active === "nivaer" || active === "resultater") && (
            children.length === 0 ? (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">{active === "nivaer" ? "Poeng og nivåer" : "Resultater"}</h2>
                <div className="bg-white rounded-xl border p-6 text-center text-gray-400 text-sm">
                  <p className="mb-1">Ingen barn lagt til ennå</p>
                  <Link href="/parent/profil"><span className="text-purple-600 text-sm underline">Legg til barn i profilen →</span></Link>
                </div>
              </div>
            ) : (
              <ChildDancerCard parentId={parentId} children={children} />
            )
          )}

          {/* Konkurranser */}
          {active === "konkurranser" && (
            <div className="space-y-3">
              <h2 className="font-semibold text-lg mb-1">Kommende konkurranser</h2>
              {upcomingComps.length === 0 && <p className="text-sm text-gray-400">Ingen kommende konkurranser</p>}
              {upcomingComps[0] && (
                <div className="bg-purple-600 rounded-2xl px-5 py-4">
                  <p className="text-xs text-purple-200 font-semibold uppercase tracking-wide mb-1">🏆 Neste konkurranse</p>
                  <p className="text-lg font-bold text-white">{upcomingComps[0].short}</p>
                  <p className="text-sm text-purple-200 mt-0.5">{upcomingComps[0].dateLabel}{upcomingComps[0].location ? ` · ${upcomingComps[0].location}` : ""}</p>
                  <div className="mt-3 flex items-end gap-1">
                    <p className="text-4xl font-bold text-white">{daysUntil(upcomingComps[0].date)}</p>
                    <p className="text-sm text-purple-200 mb-1">dager igjen</p>
                  </div>
                </div>
              )}
              {upcomingComps.slice(1).map(c => (
                <div key={c.short} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{c.short}</p>
                    <p className="text-sm text-purple-600">{c.dateLabel}</p>
                    {c.location && <p className="text-xs text-gray-400 mt-0.5">{c.location}</p>}
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full ml-3">{daysUntil(c.date)} dager</span>
                </div>
              ))}
            </div>
          )}

          {/* Om privattimer */}
          {active === "om" && (
            <div className="bg-white rounded-2xl border p-5 space-y-4">
              <h2 className="text-lg font-bold">Om privattimer</h2>
              <p className="text-gray-600 text-sm leading-relaxed">Evolutions instruktører tilbyr privattimer – koreografi, teknikk, akrobatikk o.l.</p>
              <p className="text-gray-600 text-sm leading-relaxed">En privattime varer i <strong>30 minutter</strong> og koster <strong>250,-</strong>, <strong>200,-</strong> eller <strong>150,-</strong> avhengig av trener.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 mb-1">Betaling</p>
                <p className="text-sm text-blue-700">Betaling skjer i <strong>Spond</strong>.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
