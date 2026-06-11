"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Menu, X, Calendar, Target, Trophy, Medal } from "lucide-react";
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

const sections = [
  { id: "timer", label: "Mine timer", icon: <Calendar size={15} /> },
  { id: "maal", label: "Sesongmål", icon: <Target size={15} /> },
  { id: "nivaer", label: "Poeng og nivåer", icon: <Trophy size={15} /> },
  { id: "resultater", label: "Resultater", icon: <Medal size={15} /> },
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
    <div className="space-y-4">
      {/* Desktop: tabs */}
      <div className="hidden md:flex gap-1 bg-gray-100 rounded-xl p-1">
        {sections.map(s => (
          <button key={s.id} onClick={() => goTo(s.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active === s.id ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Mobil: hamburger */}
      <div className="flex md:hidden items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">{sections.find(s => s.id === active)?.label}</p>
        <button onClick={() => setMenuOpen(o => !o)} className="p-2 rounded-xl bg-white border shadow-sm">
          {menuOpen ? <X size={20} className="text-gray-600" /> : <Menu size={20} className="text-gray-600" />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-white border rounded-2xl shadow-lg overflow-hidden">
          {sections.map(s => (
            <button key={s.id} onClick={() => goTo(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium border-b last:border-0 transition-colors ${active === s.id ? "bg-purple-50 text-purple-700" : "text-gray-700 hover:bg-gray-50"}`}>
              <span className={active === s.id ? "text-purple-600" : "text-gray-400"}>{s.icon}</span>
              {s.label}
            </button>
          ))}
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
  );
}
