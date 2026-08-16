"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Menu, X, Calendar, Trophy, Medal, Star, Info, UserCircle, User, Target } from "lucide-react";
import GoalsList from "@/components/GoalsList";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import FeedbackButton from "@/components/FeedbackButton";
import ThemeToggle from "@/components/ThemeToggle";
import NMCountdown from "@/components/NMCountdown";
import ChildDancerCard from "@/app/parent/profil/ChildDancerCard";
import CompetitionResultsCard from "@/components/CompetitionResultsCard";
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
  { id: "maal", label: "Sesongmål", icon: <Target size={15} /> },
  { id: "nivaer", label: "Poeng og nivå", icon: <Trophy size={15} /> },
  { id: "resultater", label: "Resultater", icon: <Medal size={15} /> },
  { id: "konkurranser", label: "Konkurranser", icon: <Star size={15} /> },
  { id: "om", label: "Om privattimer", icon: <Info size={15} /> },
];

type Child = { id: string; name: string; season_goals: string | null; points_freestyle: number | null; points_slow: number | null; level_freestyle: number | null; level_slow: number | null };

type Result = { id: string; competition_name: string; placement_freestyle: string | null; placement_slow: string | null; notes: string | null };

function ParentResultsSection({ parentId, children }: { parentId: string; children: Child[] }) {
  const [selectedId, setSelectedId] = useState(children[0]?.id ?? "");
  const [results, setResults] = useState<Result[]>([]);
  const [loaded, setLoaded] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId || loaded === selectedId) return;
    const supabase = createClient();
    supabase.from("competition_results").select("*").eq("child_id", selectedId).order("created_at", { ascending: false })
      .then(({ data }) => { setResults(data ?? []); setLoaded(selectedId); });
  }, [selectedId]);

  function handleChildSelect(id: string) {
    setSelectedId(id);
    if (loaded !== id) { setResults([]); setLoaded(null); }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Konkurranseresultater</h2>
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map(c => (
            <button key={c.id} onClick={() => handleChildSelect(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedId === c.id ? "bg-purple-600 text-white border-purple-600" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-400"}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      {children.length === 1 && <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{children[0].name}</p>}
      <CompetitionResultsCard userId={parentId} childId={selectedId} initialResults={results} />
    </div>
  );
}

function ParentGoalsSection({ children }: { children: Child[] }) {
  const [selectedId, setSelectedId] = useState(children[0]?.id ?? "");
  const [goals, setGoals] = useState(children[0]?.season_goals ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleChildSelect(id: string) {
    const c = children.find(x => x.id === id);
    setSelectedId(id);
    setGoals(c?.season_goals ?? "");
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase.from("children").update({ season_goals: goals }).eq("id", selectedId);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Sesongmål</h2>
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map(c => (
            <button key={c.id} onClick={() => handleChildSelect(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedId === c.id ? "bg-purple-600 text-white border-purple-600" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-400"}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      {children.length === 1 && <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{children[0].name}</p>}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5 space-y-3">
        <p className="text-xs text-gray-400 dark:text-gray-500">F.eks. triks, mål for konkurranser, hva danseren vil jobbe med</p>
        <GoalsList value={goals} onChange={g => { setGoals(g); setSaved(false); }} />
      </div>
      {saved && <div className="flex items-center gap-2 text-purple-700 text-sm bg-purple-50 border border-purple-200 rounded-xl p-3">✓ Lagret!</div>}
      <button onClick={handleSave} disabled={saving || saved}
        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
        {saving ? "Lagrer..." : "Lagre"}
      </button>
    </div>
  );
}

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
  trainers?: { name: string; styles: string[] }[];
}

export default function ParentDashboardNav({ userName, avatarUrl, notifications, upcomingBookings, completedBookings, parentId, children, trainers = [] }: Props) {
  const [active, setActive] = useState("timer");
  // parentId brukes som userId for feedback
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
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <Link href="/parent/profil" className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                {userName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{userName.split(" ")[0]}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Forelder</p>
            </div>
          </Link>
          <ThemeToggle />
          <NotificationBell notifications={notifications} />
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sections.map(s => (
          <button key={s.id} onClick={() => goTo(s.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${active === s.id ? "bg-purple-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
            <span className={active === s.id ? "text-white" : "text-gray-400 dark:text-gray-500"}>{s.icon}</span>
            {s.label}
          </button>
        ))}
        <Link href="/parent/profil"
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
    </>
  );

  return (
    <>
      <FeedbackButton userId={parentId} userName={userName} role="parent" />
      {/* Mobil: lilla topbar */}
      <div className="md:hidden sticky top-0 z-40 bg-purple-600 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] flex items-center justify-between shadow-md">
        <button onClick={() => setMenuOpen(true)} className="p-1.5 rounded-lg hover:bg-purple-700 transition-colors">
          <Menu size={24} className="text-white" />
        </button>
        <p className="text-white font-semibold text-sm">Danceitude</p>
        <div className="flex items-center gap-2">
          <div className="[&_button]:text-white [&_svg]:text-white [&_span]:bg-white [&_span]:text-purple-600">
            <ThemeToggle />
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
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30">
        <Sidebar />
      </aside>

      {/* Mobil: slide-in drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
            <div className="flex justify-end p-4">
              <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <Link href="/parent/profil" onClick={() => setMenuOpen(false)} className="px-6 pb-6 flex items-center gap-4 border-b hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl
                  ? <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-purple-600">{userName.charAt(0)}</span>}
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">{userName}</p>
                <p className="text-xs text-purple-500">Se profil →</p>
              </div>
            </Link>
            <div className="flex-1 py-4 overflow-y-auto">
              {sections.map(s => (
                <button key={s.id} onClick={() => goTo(s.id)}
                  className={`w-full flex items-center gap-4 px-6 py-3.5 text-sm font-medium transition-colors ${active === s.id ? "bg-purple-50 text-purple-700 border-r-4 border-purple-600" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950"}`}>
                  <span className={active === s.id ? "text-purple-600" : "text-gray-400 dark:text-gray-500"}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="border-t dark:border-gray-700 px-6 py-4 space-y-3 text-sm text-gray-400 dark:text-gray-500">
              <Link href="/om" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 hover:text-gray-600">
                Om Danceitude
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}

      {/* Innhold */}
      <div className="md:ml-56">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

          <h1 className="text-2xl font-bold">Heihei, {userName.split(" ")[0]}! 👋</h1>

          {/* Mine privattimer */}
          {active === "timer" && (
            <div>
              <NMCountdown />
              <div className="flex justify-between items-center mb-3 mt-4">
                <h2 className="font-semibold text-lg">Mine privattimer</h2>
                <Link href="/book">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-sm">+ Book time</Button>
                </Link>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
                <button onClick={() => setBookingTab("kommende")}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${bookingTab === "kommende" ? "bg-white dark:bg-gray-900 text-purple-700 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
                  Kommende
                </button>
                <button onClick={() => setBookingTab("gjennomforte")}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${bookingTab === "gjennomforte" ? "bg-white dark:bg-gray-900 text-purple-700 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
                  Gjennomførte
                </button>
              </div>

              {bookingTab === "kommende" && (
                upcomingBookings.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500">
                    <p className="text-lg font-medium mb-2">Ingen kommende timer</p>
                    <p className="text-sm mb-4">Book privattime for ditt barn</p>
                    <Link href="/book"><Button className="bg-purple-600 hover:bg-purple-700">Book privattime</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(weekGroups).map(([week, dateKeys]) => (
                      <div key={week}>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Uke {week}</p>
                        <div className="space-y-4">
                          {dateKeys.sort().map(dateKey => {
                            const dayBookings = grouped[dateKey];
                            const dayLabel = formatDate(new Date(dateKey), { weekday: "long", day: "numeric", month: "long" });
                            return (
                              <div key={dateKey}>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 border-b dark:border-gray-700 pb-1">{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</p>
                                <div className="space-y-2">
                                  {dayBookings.map(booking => {
                                    const start = new Date(booking.availability_slots.start_at);
                                    const end = new Date(booking.availability_slots.end_at);
                                    const hoursUntil = (start.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                                    return (
                                      <div key={booking.id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 border-l-4 border-l-purple-400 px-4 py-3">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatTime(start)}–{formatTime(end)}</p>
                                            <p className="text-sm font-medium text-purple-600">{booking.dancer_name} · {booking.dance_style}</p>
                                            {(booking.availability_slots as any)?.profiles?.name && (
                                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Trener: {(booking.availability_slots as any).profiles.name}</p>
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
                  <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500 text-sm">Ingen gjennomførte timer ennå</div>
                ) : (
                  <div className="space-y-2">
                    {completedBookings.map(booking => {
                      const start = new Date(booking.availability_slots.start_at);
                      const end = new Date(booking.availability_slots.end_at);
                      const dayLabel = formatDate(start, { weekday: "long", day: "numeric", month: "long" });
                      return (
                        <div key={booking.id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4 opacity-60">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</p>
                              <p className="text-sm text-gray-400 dark:text-gray-500">{formatTime(start)}–{formatTime(end)}</p>
                              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{booking.dancer_name} · {booking.dance_style}</p>
                              {(booking.availability_slots as any)?.profiles?.name && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Trener: {(booking.availability_slots as any).profiles.name}</p>
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
            children.length === 0 ? (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Sesongmål</h2>
                <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                  <p className="mb-1">Ingen barn lagt til ennå</p>
                  <Link href="/parent/profil"><span className="text-purple-600 text-sm underline">Legg til barn i profilen →</span></Link>
                </div>
              </div>
            ) : (
              <ParentGoalsSection children={children} />
            )
          )}

          {/* Poeng og nivå */}
          {active === "nivaer" && (
            children.length === 0 ? (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Poeng og nivå</h2>
                <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                  <p className="mb-1">Ingen barn lagt til ennå</p>
                  <Link href="/parent/profil"><span className="text-purple-600 text-sm underline">Legg til barn i profilen →</span></Link>
                </div>
              </div>
            ) : (
              <ChildDancerCard parentId={parentId} children={children} hideResults hideGoals />
            )
          )}

          {/* Resultater */}
          {active === "resultater" && (
            children.length === 0 ? (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Resultater</h2>
                <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                  <p className="mb-1">Ingen barn lagt til ennå</p>
                  <Link href="/parent/profil"><span className="text-purple-600 text-sm underline">Legg til barn i profilen →</span></Link>
                </div>
              </div>
            ) : (
              <ParentResultsSection parentId={parentId} children={children} />
            )
          )}

          {/* Konkurranser */}
          {active === "konkurranser" && (
            <div className="space-y-3">
              <h2 className="font-semibold text-lg mb-1">Kommende konkurranser</h2>
              <NMCountdown />
              {upcomingComps.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">Ingen kommende konkurranser</p>}
              {upcomingComps.slice(1).map(c => (
                <div key={c.short} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{c.short}</p>
                    <p className="text-sm text-purple-600">{c.dateLabel}</p>
                    {c.location && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{c.location}</p>}
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full ml-3">{daysUntil(c.date)} dager</span>
                </div>
              ))}
            </div>
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
                  <p className="text-sm text-blue-700">Betaling er som før i <strong>Spond</strong>.</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-amber-800 mb-1">VIKTIG!</p>
                  <p className="text-sm text-amber-700">
                    Kvitteringen du mottar for betalt privattime må danseren ha med til timen! Du kan også sende bilde av kvitteringen til treneren i forkant.
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-green-800 mb-1">Booking samme dag?</p>
                  <p className="text-sm text-green-700">Gi treneren beskjed på forhånd via melding (Messenger, Snapchat e.l.) så de er forberedt. 💬</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
                <h3 className="font-semibold text-lg mb-4">Våre trenere</h3>
                <div className="space-y-1">
                  {trainers.map(t => (
                    <div key={t.name} className="flex items-start gap-3 py-3 border-b dark:border-gray-700 last:border-0">
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0 text-sm">
                        {t.name.charAt(0)}
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

        </div>
      </div>
    </>
  );
}
