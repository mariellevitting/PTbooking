"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, X, Calendar, Target, Trophy, Medal, Star, Info } from "lucide-react";
import GoalsList from "@/components/GoalsList";
import PointsStepper from "@/components/PointsStepper";
import CompetitionResultsCard from "@/components/CompetitionResultsCard";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatTime, formatDateKey } from "@/lib/dateUtils";

const LEVELS = ["Rekrutt", "Litt øvet", "Mester", "Champ", "Elite"];

function getNeeded(level: number, isFreestyle: boolean) {
  if (level === 0) return 7;
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
  { id: "maal", label: "Sesongmål", icon: <Target size={15} /> },
  { id: "nivaer", label: "Poeng og nivåer", icon: <Trophy size={15} /> },
  { id: "resultater", label: "Resultater", icon: <Medal size={15} /> },
  { id: "konkurranser", label: "Konkurranser", icon: <Star size={15} /> },
  { id: "om", label: "Om privattimer", icon: <Info size={15} /> },
];

const TRAINERS = [
  { name: "Sophie", styles: ["Freestyle", "Slow", "Jazz", "Moderne", "Freestyle dobbel", "Slow dobbel", "Akro"] },
  { name: "Lova", styles: ["Freestyle", "Slow", "Jazz", "Moderne", "Freestyle dobbel", "Slow dobbel", "Akro"] },
  { name: "Marielle", styles: ["Freestyle", "Slow", "Akro", "Freestyle dobbel", "Slow dobbel"] },
  { name: "Marthe", styles: ["Freestyle", "Slow", "Akro", "Freestyle dobbel", "Slow dobbel"] },
  { name: "Luna Kekstaite", styles: ["Freestyle", "Slow", "Jazz", "Moderne", "Freestyle dobbel", "Slow dobbel", "Akro"] },
  { name: "Cathrin Jørgensen", styles: ["Hiphop"] },
];

export default function DancerDashboardNav(props: Props) {
  const [active, setActive] = useState("timer");
  const [menuOpen, setMenuOpen] = useState(false);
  const [goals, setGoals] = useState(props.seasonGoals);
  const [freestyle, setFreestyle] = useState(props.pointsFreestyle);
  const [slow, setSlow] = useState(props.pointsSlow);
  const [levelF, setLevelF] = useState(props.levelFreestyle);
  const [levelS, setLevelS] = useState(props.levelSlow);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const now = new Date(props.now);

  function goTo(id: string) { setActive(id); setMenuOpen(false); }

  function handleFreestyleChange(val: number) {
    setSaved(false);
    if (val < 0) { setLevelF(l => Math.max(0, l - 1)); setFreestyle(0); return; }
    const needed = getNeeded(levelF, true);
    if (levelF < 3 && val >= needed) { setLevelF(l => Math.min(l + 1, 4)); setFreestyle(0); }
    else setFreestyle(val);
  }

  function handleSlowChange(val: number) {
    setSaved(false);
    if (val < 0) { setLevelS(l => Math.max(0, l - 1)); setSlow(0); return; }
    const needed = getNeeded(levelS, false);
    if (levelS < 3 && val >= needed) { setLevelS(l => Math.min(l + 1, 4)); setSlow(0); }
    else setSlow(val);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase.from("profiles").update({
      season_goals: goals,
      points_freestyle: freestyle,
      points_slow: slow,
      level_freestyle: levelF,
      level_slow: levelS,
    }).eq("id", props.userId);
    setSaving(false);
    setSaved(true);
  }

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
    <div className="md:flex md:gap-6">
      {/* Desktop: vertikal meny til venstre */}
      <div className="hidden md:flex flex-col gap-1 w-48 shrink-0">
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm sticky top-6">
          {sections.map(s => (
            <button key={s.id} onClick={() => goTo(s.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium border-b last:border-0 transition-colors text-left ${active === s.id ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <span className={active === s.id ? "text-purple-600" : "text-gray-400"}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Innhold */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Mobil: hamburger-knapp */}
        <div className="flex md:hidden justify-start">
          <button onClick={() => setMenuOpen(true)} className="p-2.5 rounded-xl bg-white border shadow-sm">
            <Menu size={22} className="text-gray-600" />
          </button>
        </div>

        {/* Mobil: slide-in drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Mørk bakgrunn */}
            <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
            {/* Drawer */}
            <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col">
              {/* Lukk-knapp */}
              <div className="flex justify-end p-4">
                <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              {/* Profil */}
              <Link href="/dancer/profil" onClick={() => setMenuOpen(false)} className="px-6 pb-6 flex items-center gap-4 border-b hover:bg-gray-50 transition-colors">
                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0">
                  {props.avatarUrl
                    ? <img src={props.avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                    : <span className="text-2xl font-bold text-purple-600">{props.userName.charAt(0)}</span>}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{props.userName}</p>
                  <p className="text-xs text-purple-500">Se profil →</p>
                </div>
              </Link>
              {/* Menyvalg */}
              <div className="flex-1 py-4 overflow-y-auto">
                {sections.map(s => (
                  <button key={s.id} onClick={() => goTo(s.id)}
                    className={`w-full flex items-center gap-4 px-6 py-3.5 text-sm font-medium transition-colors ${active === s.id ? "bg-purple-50 text-purple-700 border-r-4 border-purple-600" : "text-gray-600 hover:bg-gray-50"}`}>
                    <span className={active === s.id ? "text-purple-600" : "text-gray-400"}>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}


      {/* Mine timer */}
      {active === "timer" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Mine privattimer</h2>
            <Link href="/book">
              <Button className="bg-purple-600 hover:bg-purple-700 text-sm">+ Book time</Button>
            </Link>
          </div>
          {props.upcomingBookings.length === 0 && props.completedBookings.length === 0 ? (
            <div className="bg-white rounded-xl border p-6 text-center text-gray-400">
              <p className="text-lg font-medium mb-2">Ingen bookede timer</p>
              <p className="text-sm mb-6">Finn en trener og book din første privattime</p>
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
                          <p className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">
                            {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
                          </p>
                          <div className="space-y-2">
                            {dayBookings.map(booking => {
                              const start = new Date(booking.availability_slots.start_at);
                              const end = new Date(booking.availability_slots.end_at);
                              const hoursUntil = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
                              return (
                                <div key={booking.id} className="bg-white rounded-xl border border-l-4 border-l-purple-400 px-4 py-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-700">{formatTime(start)}–{formatTime(end)}</p>
                                      <p className="text-sm font-medium text-purple-600">{booking.dance_style}</p>
                                      {booking.availability_slots?.profiles?.name && (
                                        <p className="text-xs text-gray-500">Trener: {booking.availability_slots.profiles.name}</p>
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
              {props.completedBookings.length > 0 && (
                <div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gjennomførte timer</p>
                    <p className="text-xs text-purple-500">{props.completedBookings.length} totalt 🎉</p>
                  </div>
                  <div className="space-y-2 opacity-60">
                    {props.completedBookings.slice(0, 5).map(booking => {
                      const start = new Date(booking.availability_slots.start_at);
                      const end = new Date(booking.availability_slots.end_at);
                      const dayLabel = formatDate(start, { weekday: "long", day: "numeric", month: "long" });
                      return (
                        <div key={booking.id} className="bg-white rounded-xl border px-4 py-3">
                          <p className="text-xs text-gray-400">{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</p>
                          <p className="text-sm font-semibold text-gray-600">{formatTime(start)}–{formatTime(end)}</p>
                          <p className="text-sm text-gray-500">{booking.dance_style}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sesongmål */}
      {active === "maal" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target size={16} className="text-purple-500" /> Mine sesongmål
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400 mb-3">F.eks. triks du vil lære, mål for konkurranser, hva du vil jobbe med denne sesongen</p>
            <GoalsList value={goals} onChange={g => { setGoals(g); setSaved(false); }} />
          </CardContent>
        </Card>
      )}

      {/* Poeng og nivåer */}
      {active === "nivaer" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy size={16} className="text-purple-500" /> Poeng og nivåer
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
                    <p className="text-sm font-semibold text-gray-700">{label}</p>
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{LEVELS[level]}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] px-0.5">
                      {LEVELS.map((name, i) => <span key={i} className={i <= level ? "text-purple-600 font-semibold" : "text-gray-400"}>{name}</span>)}
                    </div>
                    <div style={{ height: "12px", backgroundColor: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
                      <div style={{ height: "100%", backgroundColor: "#7c3aed", borderRadius: "9999px", width: `${Math.max(3, (level / 4) * 100 + (percent / 100) * (100 / 4))}%`, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                  <PointsStepper value={points} onChange={onChange} />
                  {level >= 3 ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                      <Trophy size={14} className="text-yellow-500" /> Neste nivå avgjøres av plasseringer på stevner
                    </div>
                  ) : (
                    <div className="flex justify-between text-xs text-gray-500">
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
      {active === "konkurranser" && (() => {
        const upcoming = COMPETITIONS.filter(c => c.date >= new Date());
        const next = upcoming[0];
        const rest = upcoming.slice(1);
        if (upcoming.length === 0) return <p className="text-sm text-gray-400 text-center py-6">Ingen kommende konkurranser</p>;
        const daysUntil = (d: Date) => Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return (
          <div className="space-y-3">
            {/* Neste konkurranse – uthevet */}
            <div className="bg-purple-600 rounded-2xl px-5 py-4">
              <p className="text-xs text-purple-200 font-semibold uppercase tracking-wide mb-1">🏆 Neste konkurranse</p>
              <p className="text-lg font-bold text-white">{next.name}</p>
              <p className="text-sm text-purple-200 mt-0.5">{next.dateLabel}{next.location ? ` · ${next.location}` : ""}</p>
              <div className="mt-3 flex items-end gap-1">
                <p className="text-4xl font-bold text-white">{daysUntil(next.date)}</p>
                <p className="text-sm text-purple-200 mb-1">dager igjen</p>
              </div>
            </div>
            {/* Resten */}
            {rest.map(c => (
              <div key={c.name} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{c.name}</p>
                  <p className="text-sm text-purple-600">{c.dateLabel}</p>
                  {c.location && <p className="text-xs text-gray-400 mt-0.5">{c.location}</p>}
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full whitespace-nowrap ml-3">
                  {daysUntil(c.date)} dager
                </span>
              </div>
            ))}
          </div>
        );
      })()}

        {/* Om privattimer */}
        {active === "om" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-5 space-y-4">
              <h2 className="text-lg font-bold">Bestille privattimer</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Evolutions instruktører tilbyr privattimer. Disse kan benyttes etter ønske – koreografi, teknikk, akrobatikk o.l. Dette er en flott mulighet for danserne til å utvikle seg og få tett oppfølging av trenerteamet.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
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

            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold text-lg mb-4">Våre trenere</h3>
              <div className="space-y-1">
                {TRAINERS.map(t => (
                  <div key={t.name} className="flex items-start gap-3 py-3 border-b last:border-0">
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0 text-sm">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.styles.join(" · ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lagre-knapp for mål og nivåer */}
        {(active === "maal" || active === "nivaer") && (
          <div className="space-y-2">
            {saved && (
              <div className="flex items-center gap-2 text-purple-700 text-sm bg-purple-50 border border-purple-200 rounded-xl p-3">
                ✓ Lagret!
              </div>
            )}
            <Button onClick={handleSave} className="w-full bg-purple-600 hover:bg-purple-700" disabled={saving || saved}>
              {saving ? "Lagrer..." : "Lagre"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
