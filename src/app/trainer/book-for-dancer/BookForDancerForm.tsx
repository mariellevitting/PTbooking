"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";

const DOUBLE_STYLES = ["Freestyle dobbel", "Slow dobbel"];

function isDouble(style: string) {
  return DOUBLE_STYLES.includes(style);
}

function getMondayOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(monday: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getTimeSlots(date: Date) {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  const startHour = isWeekend ? 9 : 14;
  const slots = [];
  for (let h = startHour; h < 21; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

function dateToISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DAY_NAMES = ["man", "tir", "ons", "tor", "fre", "lør", "søn"];

interface LinkedUser {
  id: string;
  name: string;
  role: string;
}

interface Props {
  trainerId: string;
  danceStyles: string[];
}

export default function BookForDancerForm({ trainerId, danceStyles }: Props) {
  const router = useRouter();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weekStart, setWeekStart] = useState(getMondayOfWeek(today));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [time, setTime] = useState("");
  const [dancer1, setDancer1] = useState("");
  const [dancer2, setDancer2] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LinkedUser[]>([]);
  const [linkedUser, setLinkedUser] = useState<LinkedUser | null>(null);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const weekDays = getWeekDays(weekStart);
  const weekNumber = getWeekNumber(weekStart);
  const timeSlots = getTimeSlots(selectedDate);
  const double = isDouble(style);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, name, role")
        .in("role", ["dancer", "parent"])
        .ilike("name", `%${trimmed}%`)
        .limit(6);
      setSearchResults(data ?? []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectUser(user: LinkedUser) {
    setLinkedUser(user);
    setDancer1(user.name);
    setSearchQuery("");
    setSearchResults([]);
  }

  function clearLinkedUser() {
    setLinkedUser(null);
    setDancer1("");
  }

  function prevWeek() {
    const prev = new Date(weekStart);
    prev.setDate(weekStart.getDate() - 7);
    if (prev >= getMondayOfWeek(today)) {
      setWeekStart(prev);
      const days = getWeekDays(prev);
      const first = days.find(d => d >= today) ?? days[0];
      setSelectedDate(first);
      setTime("");
    }
  }

  function nextWeek() {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + 7);
    setWeekStart(next);
    const days = getWeekDays(next);
    setSelectedDate(days[0]);
    setTime("");
  }

  function pickDate(date: Date) {
    if (date < today) return;
    setSelectedDate(date);
    setTime("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !time || !dancer1) return;
    if (double && !dancer2) return;

    setLoading(true);
    setError("");

    const supabase = createClient();
    const dateStr = dateToISO(selectedDate);
    const start = new Date(`${dateStr}T${time}:00`);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const dancerName = double ? `${dancer1} & ${dancer2}` : dancer1;

    // Bruk eksisterende ledig slot på dette tidspunktet hvis den finnes
    const { data: existing } = await supabase
      .from("availability_slots")
      .select("id")
      .eq("trainer_id", trainerId)
      .eq("start_at", start.toISOString())
      .maybeSingle();

    let slotId: string;
    if (existing) {
      slotId = existing.id;
    } else {
      const { data: newSlot, error: slotError } = await supabase
        .from("availability_slots")
        .insert({ trainer_id: trainerId, start_at: start.toISOString(), end_at: end.toISOString() })
        .select("id")
        .single();
      if (slotError || !newSlot) {
        setError("Klarte ikke opprette time. Prøv igjen.");
        setLoading(false);
        return;
      }
      slotId = newSlot.id;
    }

    const { error: bookError } = await supabase.from("bookings").insert({
      slot_id: slotId,
      booker_id: trainerId,
      dancer_name: dancerName,
      dance_style: style || "",
      status: "confirmed",
      linked_user_id: linkedUser?.id ?? null,
    });

    if (bookError) {
      setError("Timen ble opprettet men booking feilet. Prøv igjen.");
      setLoading(false);
      return;
    }

    if (linkedUser) {
      const tidspunkt = start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" }) +
        " kl. " + start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
      await supabase.from("notifications").insert({
        user_id: linkedUser.id,
        message: `Treneren har booket en privattime for deg i ${style || "ukjent stil"} – ${tidspunkt}`,
      });
    }

    router.push("/trainer/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardContent className="pt-5 space-y-3">
          {/* Danser 1 – kombinert søk + navn */}
          <div ref={searchRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {double ? "Danser 1" : "Danserens navn"}
            </label>
            {linkedUser ? (
              <div className="flex items-center justify-between bg-[#f5eeff] border border-[#E2A9F1]/40 rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-purple-800">{linkedUser.name}</p>
                  <p className="text-xs text-[#E2A9F1]">Koblet til profil · får varsel</p>
                </div>
                <button type="button" onClick={clearLinkedUser} className="text-[#E2A9F1] hover:text-[#c87de0] ml-2">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={dancer1}
                  onChange={e => { setDancer1(e.target.value); setSearchQuery(e.target.value); }}
                  onFocus={() => dancer1.length >= 2 && setSearchQuery(dancer1)}
                  placeholder="Skriv navn..."
                  className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900"
                  required
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                    {searchResults.map(u => (
                      <button key={u.id} type="button" onClick={() => selectUser(u)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#f5eeff] dark:hover:bg-purple-950/30 flex items-center justify-between border-t dark:border-gray-700 first:border-t-0">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{u.name}</span>
                        <span className="text-xs text-[#E2A9F1]">Koble til profil</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {double && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Danser 2</label>
              <input
                type="text"
                value={dancer2}
                onChange={(e) => setDancer2(e.target.value)}
                placeholder="Fullt navn"
                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900"
                required
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevWeek} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 text-xl">‹</button>
            <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Uke {weekNumber}</span>
            <button type="button" onClick={nextWeek} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 text-xl">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, i) => {
              const isPast = day < today;
              const isSelected = dateToISO(day) === dateToISO(selectedDate);
              const isToday = dateToISO(day) === dateToISO(today);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickDate(day)}
                  disabled={isPast}
                  className={`flex flex-col items-center py-2 rounded-lg transition-colors ${
                    isSelected
                      ? "bg-[#3A3A3A] text-[#E2A9F1]"
                      : isPast
                      ? "text-gray-300 dark:text-gray-600 cursor-default"
                      : isToday
                      ? "bg-[#edd5f9] text-[#c87de0] hover:bg-[#E2A9F1]/30"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span className="text-xs uppercase">{DAY_NAMES[i]}</span>
                  <span className="text-lg font-semibold">{day.getDate()}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
            {selectedDate.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map((slot) => {
              const isToday = dateToISO(selectedDate) === dateToISO(new Date());
              const isPastSlot = isToday && (() => {
                const [h, m] = slot.split(":").map(Number);
                const slotTime = new Date();
                slotTime.setHours(h, m, 0, 0);
                return slotTime <= new Date();
              })();
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => !isPastSlot && setTime(slot)}
                  disabled={isPastSlot}
                  className={`py-2 px-1 rounded-lg text-sm font-medium border transition-colors ${
                    isPastSlot
                      ? "bg-gray-50 dark:bg-gray-950 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-800 cursor-not-allowed"
                      : time === slot
                      ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A]"
                      : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#E2A9F1]"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Danseform <span className="text-gray-400 dark:text-gray-500 font-normal">(valgfritt)</span></p>
          <div className="flex flex-wrap gap-2">
            {danceStyles.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStyle(style === s ? "" : s); setDancer2(""); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  style === s
                    ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A]"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#E2A9F1]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        type="submit"
        className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a]"
        disabled={loading || !time || !dancer1 || (double && !dancer2)}
      >
        {loading ? "Lagrer..." : "Book time"}
      </Button>
    </form>
  );
}
