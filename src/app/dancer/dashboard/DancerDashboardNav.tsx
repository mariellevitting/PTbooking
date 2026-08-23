"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, X, Calendar, Target, Trophy, Medal, Star, Info, UserCircle, User } from "lucide-react";
import GoalsList from "@/components/GoalsList";
import PointsStepper from "@/components/PointsStepper";
import CompetitionResultsCard from "@/components/CompetitionResultsCard";
import NotificationBell from "@/components/NotificationBell";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import FeedbackButton from "@/components/FeedbackButton";
import NMCountdown from "@/components/NMCountdown";
import CompetitionList from "@/components/CompetitionList";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatTime, formatDateKey } from "@/lib/dateUtils";

const LEVELS = ["Rekrutt", "Litt øvet", "Mester", "Champ", "Elite"];

function getNeeded(level: number, isFreestyle: boolean) {
  if (level === 0) return 8;
  if (level === 1) return 14;
  if (level === 2) return isFreestyle ? 21 : 28;
  return 0;
}

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

type Booking = any;
type Result = { id: string; competition_name: string; placement_freestyle: string | null; placement_slow: string | null; notes: string | null };

interface Props {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  upcomingBookings: Booking[];
  completedBookings: Booking[];
  seasonGoals: string;
  pointsFreestyle: number;
  pointsSlow: number;
  levelFreestyle: number;
  levelSlow: number;
  competitionResults: Result[];
  now: string;
  notifications?: any[];
  mobileNavOnly?: boolean;
  trainers?: { name: string; avatarUrl: string | null; styles: string[] }[];
  goalsVisibleToTrainer?: boolean;
}

const COMPETITIONS = [
  { name: "Norgesmesterskapet 2026", short: "NM 2026", date: new Date("2026-06-13"), dateLabel: "13–14. juni", location: "Sofiemyrhallen, Sofienmyr" },
  { name: "Freestyle Dance Jam 6", short: "FDJ 6", date: new Date("2026-08-22"), dateLabel: "22. august", location: "Gausdal Arena, Lillehammer" },
  { name: "Freestyle Dance Jam 7", short: "FDJ 7", date: new Date("2026-09-19"), dateLabel: "19. september", location: null },
  { name: "Freestyle Dance Jam 8", short: "FDJ 8", date: new Date("2026-10-17"), dateLabel: "17. oktober", location: "Fjellhamar Arena, Lørenskog" },
  { name: "Dancer of the Year / FDJ 9", short: "DOTY / FDJ 9", date: new Date("2026-11-21"), dateLabel: "21. november", location: null },
];

const sections = [
  { id: "timer", label: "Mine timer", icon: <Calendar size={15} /> },
  { id: "maal", label: "Mine sesongmål", icon: <Target size={15} /> },
  { id: "nivaer", label: "Poeng og nivåer", icon: <Trophy size={15} /> },
  { id: "resultater", label: "Resultater", icon: <Medal size={15} /> },
  { id: "konkurranser", label: "Konkurranser", icon: <Star size={15} /> },
  { id: "om", label: "Om privattimer", icon: <Info size={15} /> },
];


export default function DancerDashboardNav(props: Props) {
  const [active, setActive] = useState("timer");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingTab, setBookingTab] = useState<"kommende" | "gjennomforte">("kommende");
  const [goals, setGoals] = useState(props.seasonGoals);
  const [visibleToTrainer, setVisibleToTrainer] = useState(props.goalsVisibleToTrainer ?? true);
  const [freestyle, setFreestyle] = useState(props.pointsFreestyle);
  const [slow, setSlow] = useState(props.pointsSlow);
  const [levelF, setLevelF] = useState(props.levelFreestyle);
  const [levelS, setLevelS] = useState(props.levelSlow);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isFirstRender = useRef(true);
  const [topbarVisible, setTopbarVisible] = useState(true);
  const lastScrollY = useRef(0);

  const now = new Date(props.now);

  useEffect(() => {
    function handleScroll() {
      const y = window.scrollY;
      if (y < 10) { setTopbarVisible(true); }
      else if (y < lastScrollY.current) { setTopbarVisible(true); }
      else if (y > lastScrollY.current + 4) { setTopbarVisible(false); }
      lastScrollY.current = y;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function goTo(id: string) { setActive(id); setMenuOpen(false); setTopbarVisible(true); }

  function handleFreestyleChange(val: number) {
    if (val < 0) { setLevelF(l => Math.max(0, l - 1)); setFreestyle(0); return; }
    const needed = getNeeded(levelF, true);
    if (levelF < 3 && val >= needed) { setLevelF(l => Math.min(l + 1, 4)); setFreestyle(0); }
    else setFreestyle(val);
  }

  function handleSlowChange(val: number) {
    if (val < 0) { setLevelS(l => Math.max(0, l - 1)); setSlow(0); return; }
    const needed = getNeeded(levelS, false);
    if (levelS < 3 && val >= needed) { setLevelS(l => Math.min(l + 1, 4)); setSlow(0); }
    else setSlow(val);
  }

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setSaved(false);
    setSaving(true);
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").update({
        season_goals: goals,
        points_freestyle: freestyle,
        points_slow: slow,
        level_freestyle: levelF,
        level_slow: levelS,
        goals_visible_to_trainer: visibleToTrainer,
      }).eq("id", props.userId);
      setSaving(false);
      if (error) { setSaveError("Feil: " + error.message); }
      else { setSaved(true); setSaveError(null); }
    }, 600);
    return () => clearTimeout(timer);
  }, [goals, freestyle, slow, levelF, levelS, visibleToTrainer]);

  // Booking sections grouped by week
  const grouped: Record<string, Booking[]> = {};
  for (const b of props.upcomingBookings) {
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

  const neededF = getNeeded(levelF, true);
  const percentF = neededF > 0 ? Math.round((Math.min(freestyle, neededF) / neededF) * 100) : 100;
  const neededS = getNeeded(levelS, false);
  const percentS = neededS > 0 ? Math.round((Math.min(slow, neededS) / neededS) * 100) : 100;

  return (
    <div>
      <FeedbackButton userId={props.userId} userName={props.userName} role="dancer" />
      {/* Mobil: lilla topbar */}
      <div className={`md:hidden fixed top-0 left-0 right-0 z-40 bg-[#3A3A3A] dark:bg-[#4a4a4a] px-4 pb-1.5 pt-[calc(0.5rem+env(safe-area-inset-top))] flex items-center justify-between shadow-md transition-transform duration-300 ${topbarVisible ? "translate-y-0" : "-translate-y-full"}`}>
        <button onClick={() => setMenuOpen(true)} className="p-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors">
          <Menu size={24} className="text-[#E2A9F1]" />
        </button>
        <p className="text-[#E2A9F1] font-semibold text-sm">Danceitude</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center [&_button]:text-[#E2A9F1] [&_svg]:text-[#E2A9F1] [&_span]:bg-[#E2A9F1] [&_span]:text-[#3A3A3A]">
            <ThemeToggle />
            <NotificationBell notifications={props.notifications ?? []} />
          </div>
          <Link href="/dancer/profil" className="hover:opacity-80 transition-opacity">
            {props.avatarUrl
              ? <img src={props.avatarUrl} alt="Profil" className="w-8 h-8 rounded-full object-cover border-2 border-[#E2A9F1]" />
              : <UserCircle size={28} className="text-[#E2A9F1]" />}
          </Link>
        </div>
      </div>

      {/* Desktop: fast sidebar til venstre */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <Link href="/dancer/profil" className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
              {props.avatarUrl ? (
                <img src={props.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center text-[#c87de0] font-bold text-sm shrink-0">
                  {props.userName.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{props.userName.split(" ")[0]}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Danser</p>
              </div>
            </Link>
            <ThemeToggle />
            <NotificationBell notifications={props.notifications ?? []} />
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sections.map(s => (
            <button key={s.id} onClick={() => goTo(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${active === s.id ? "bg-[#3A3A3A] text-[#E2A9F1]" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              <span className={active === s.id ? "text-[#E2A9F1]" : "text-gray-400 dark:text-gray-500"}>{s.icon}</span>
              {s.label}
            </button>
          ))}
          <Link href="/dancer/profil"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <span className="text-gray-400 dark:text-gray-500"><User size={15} /></span>
            Profil
          </Link>
        </nav>
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <Link href="/om" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            Om Danceitude
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="md:ml-56 px-4 pb-4 pt-[calc(3.5rem+env(safe-area-inset-top))] md:p-6">
      {/* Innhold */}
      <div className="max-w-lg mx-auto space-y-4">

        {/* Mobil: slide-in drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Mørk bakgrunn */}
            <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
            {/* Drawer */}
            <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
              {/* Lukk-knapp */}
              <div className="flex justify-end p-4">
                <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              {/* Profil */}
              <Link href="/dancer/profil" onClick={() => setMenuOpen(false)} className="px-6 pb-6 flex items-center gap-4 border-b hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors">
                <div className="w-14 h-14 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center overflow-hidden shrink-0">
                  {props.avatarUrl
                    ? <img src={props.avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                    : <span className="text-2xl font-bold text-[#E2A9F1]">{props.userName.charAt(0)}</span>}
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100">{props.userName}</p>
                  <p className="text-xs text-[#E2A9F1]">Se profil →</p>
                </div>
              </Link>
              {/* Menyvalg */}
              <div className="flex-1 py-4 overflow-y-auto">
                {sections.map(s => (
                  <button key={s.id} onClick={() => goTo(s.id)}
                    className={`w-full flex items-center gap-4 px-6 py-3.5 text-sm font-medium transition-colors ${active === s.id ? "bg-[#f5eeff] dark:bg-[#E2A9F1]/10 text-[#c87de0] border-r-4 border-[#3A3A3A]" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950"}`}>
                    <span className={active === s.id ? "text-[#E2A9F1]" : "text-gray-400 dark:text-gray-500"}>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
              {/* Logg ut – nederst */}
              <div className="border-t dark:border-gray-700 px-6 py-4 space-y-3">
                <Link href="/om" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600">
                  Om Danceitude
                </Link>
                <div className="text-gray-400 dark:text-gray-500 text-sm">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>
        )}


      {active === "timer" && (
        <h1 className="text-2xl font-bold">Hei, {props.userName.split(" ")[0]}! 👋</h1>
      )}

      {/* Mine timer */}
      {active === "timer" && (
        <div>
          <NMCountdown />
          <div className="flex justify-between items-center mb-3 mt-4">
            <h2 className="font-semibold text-lg">Mine privattimer</h2>
            <Link href="/book">
              <Button className="bg-[#3A3A3A] hover:bg-[#2a2a2a] text-sm">+ Book time</Button>
            </Link>
          </div>

          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
            <button onClick={() => setBookingTab("kommende")}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${bookingTab === "kommende" ? "bg-white dark:bg-gray-900 text-[#c87de0] shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
              Kommende
            </button>
            <button onClick={() => setBookingTab("gjennomforte")}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${bookingTab === "gjennomforte" ? "bg-white dark:bg-gray-900 text-[#c87de0] shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
              Gjennomførte
            </button>
          </div>

          {bookingTab === "kommende" && (
            props.upcomingBookings.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500">
                <p className="text-lg font-medium mb-2">Ingen kommende timer</p>
                <p className="text-sm mb-4">Finn en trener og book din første privattime</p>
                <Link href="/book"><Button className="bg-[#3A3A3A] hover:bg-[#2a2a2a]">Book privattime</Button></Link>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(weekGroups).map(([week, dateKeys]) => (
                  <div key={week}>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Uke {week}</p>
                    <div className="space-y-4">
                      {(dateKeys as string[]).sort().map(dateKey => {
                        const dayBookings = grouped[dateKey];
                        const dayLabel = formatDate(new Date(dateKey), { weekday: "long", day: "numeric", month: "long" });
                        return (
                          <div key={dateKey}>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 border-b dark:border-gray-700 pb-1">{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</p>
                            <div className="space-y-2">
                              {dayBookings.map((booking: Booking) => {
                                const start = new Date(booking.availability_slots.start_at);
                                const end = new Date(booking.availability_slots.end_at);
                                const hoursUntil = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
                                return (
                                  <div key={booking.id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 border-l-4 border-l-[#E2A9F1] px-4 py-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatTime(start)}–{formatTime(end)}</p>
                                        <p className="text-sm font-medium text-[#E2A9F1]">{booking.dance_style}</p>
                                        {booking.availability_slots?.profiles?.name && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400">Trener: {booking.availability_slots.profiles.name}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Bekreftet</span>
                                        <Link href={`/booking/avbestill/${booking.id}`} prefetch={false}>
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
            props.completedBookings.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500 text-sm">Ingen gjennomførte timer ennå</div>
            ) : (
              <div className="space-y-2">
                {props.completedBookings.map((booking: Booking) => {
                  const start = new Date(booking.availability_slots.start_at);
                  const end = new Date(booking.availability_slots.end_at);
                  const dayLabel = formatDate(start, { weekday: "long", day: "numeric", month: "long" });
                  return (
                    <div key={booking.id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4 opacity-60">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">{formatTime(start)}–{formatTime(end)}</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{booking.dance_style}</p>
                          {booking.availability_slots?.profiles?.name && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">Trener: {booking.availability_slots.profiles.name}</p>
                          )}
                        </div>
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full">Fullført</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* Sesongmål */}
      {active === "maal" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target size={16} className="text-[#E2A9F1]" /> Mine sesongmål
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">F.eks. triks du vil lære, mål for konkurranser, hva du vil jobbe med denne sesongen. Huk av når du har klart målet ditt.</p>
            <GoalsList value={goals} onChange={g => { setGoals(g); setSaved(false); }} />
            <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={visibleToTrainer}
                onChange={e => { setVisibleToTrainer(e.target.checked); setSaved(false); }}
                className="w-4 h-4 accent-[#c87de0] rounded"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Vis sesongmål for trenere</span>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Poeng og nivåer */}
      {active === "nivaer" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy size={16} className="text-[#E2A9F1]" /> Poeng og nivåer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { label: "Freestyle", points: freestyle, level: levelF, percent: percentF, needed: neededF, onChange: handleFreestyleChange },
              { label: "Slow", points: slow, level: levelS, percent: percentS, needed: neededS, onChange: handleSlowChange },
            ].map(({ label, points, level, percent, needed, onChange }, idx) => (
              <div key={label} className={idx > 0 ? "border-t pt-6" : ""}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
                    <span className="text-xs font-bold text-[#E2A9F1] bg-[#f5eeff] dark:bg-[#E2A9F1]/10 px-2 py-0.5 rounded-full">{LEVELS[level]}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] px-0.5">
                      {LEVELS.map((name, i) => <span key={i} className={i <= level ? "text-[#E2A9F1] font-semibold" : "text-gray-400 dark:text-gray-500"}>{name}</span>)}
                    </div>
                    <div style={{ height: "12px", backgroundColor: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
                      <div style={{ height: "100%", backgroundColor: "#7c3aed", borderRadius: "9999px", width: `${Math.max(3, (level / 4) * 100 + (percent / 100) * (100 / 4))}%`, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                  <PointsStepper value={points} onChange={onChange} disabled={level >= 3} />
                  {level >= 3 ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                      <Trophy size={14} className="text-yellow-500" /> Neste nivå avgjøres av plasseringer på stevner
                    </div>
                  ) : (
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{Math.min(points, needed)} / {needed} poeng mot {LEVELS[level + 1]}</span>
                      <span>{percent}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Konkurranseresultater */}
      {active === "resultater" && (
        <CompetitionResultsCard userId={props.userId} initialResults={props.competitionResults} />
      )}

      {/* Kommende konkurranser */}
      {active === "konkurranser" && (
        <CompetitionList userId={props.userId} showCountdown />
      )}

        {/* Om privattimer */}
        {active === "om" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5 space-y-4">
              <h2 className="text-lg font-bold">Bestille privattimer</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Evolutions instruktører tilbyr privattimer. Disse kan benyttes etter ønske – koreografi, teknikk, akrobatikk o.l. Dette er en flott mulighet for danserne til å utvikle seg og få tett oppfølging av trenerteamet.
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                En privattime varer i <strong>30 minutter</strong> og koster <strong>250,-</strong>, <strong>200,-</strong> eller <strong>150,-</strong> avhengig av trener.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 mb-1">Betaling</p>
                <p className="text-sm text-blue-700">Betaling er som før på <a href="https://club.spond.com/landing/courses/evolutsarpsdans/3A3FA8760C0A49B085117E051204FA8C/main_products?source=direct" target="_blank" rel="noopener noreferrer" className="underline font-semibold">hjemmesiden til Spond</a>.</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">VIKTIG!</p>
                <p className="text-sm text-amber-700">
                  Kvitteringen du mottar for betalt privattime må danseren ha med til timen! Du kan også sende bilde av kvitteringen til treneren i forkant.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-green-800 mb-1">Booking samme dag?</p>
                <p className="text-sm text-green-700">Gi treneren beskjed på forhånd via melding så de er forberedt. 💬</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
              <h3 className="font-semibold text-lg mb-4">Våre trenere</h3>
              <div className="space-y-1">
                {(props.trainers ?? []).map(t => (
                  <div key={t.name} className="flex items-start gap-3 py-3 border-b dark:border-gray-700 last:border-0">
                    <div className="w-9 h-9 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center text-[#E2A9F1] font-bold shrink-0 text-sm overflow-hidden">
                      {t.avatarUrl
                        ? <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" />
                        : t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t.styles.join(" · ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Auto-lagring status */}
        {(active === "maal" || active === "nivaer") && (saving || saved || saveError) && (
          <p className={`text-xs text-center pb-1 ${saveError ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}>
            {saving ? "Lagrer..." : saveError ? saveError : "✓ Lagret"}
          </p>
        )}
      </div>
      </div>
    </div>
  );
}

