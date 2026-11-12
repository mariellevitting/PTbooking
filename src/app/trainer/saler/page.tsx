"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getSlotsForDate(date: Date) {
  const startHour = isWeekend(date) ? 9 : 14;
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

interface Room {
  id: string;
  name: string;
}

interface SlotInfo {
  isBooked: boolean;
  bookingId?: string;
  dancerName?: string;
  bookerId?: string;
}

interface CancelTarget {
  bookingId: string;
  dancerName: string;
  bookerId: string;
  roomName: string;
  startAt: string;
}

interface PublishedSummary {
  count: number;
  roomNames: string;
}

interface RoomBookingRow {
  id: string;
  dancer_name: string;
  booker_id: string;
  room_slots: { start_at: string; end_at: string; rooms: { name: string } | null } | null;
}

// roomId -> dateKey -> klokkeslett. Valgt, men ikke publisert ennå.
// Egen nøkkel per sal slik at man kan velge tider i flere saler før man
// publiserer alt samlet – bytte av sal-fane skal ikke slette valg man
// allerede har gjort i en annen sal.
type PendingMap = Map<string, Map<string, Set<string>>>;

function getRoomDay(pending: PendingMap, roomId: string | null, dateKey: string): Set<string> {
  if (!roomId) return new Set();
  return pending.get(roomId)?.get(dateKey) ?? new Set();
}

function countAll(pending: PendingMap): number {
  let total = 0;
  for (const byDate of pending.values()) {
    for (const times of byDate.values()) total += times.size;
  }
  return total;
}

function countForRoom(pending: PendingMap, roomId: string): number {
  let total = 0;
  for (const times of (pending.get(roomId)?.values() ?? [])) total += times.size;
  return total;
}

export default function SalerPage() {
  const router = useRouter();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(true);

  const [pageTab, setPageTab] = useState<"publish" | "bookings">("publish");
  const [bookings, setBookings] = useState<RoomBookingRow[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsLoaded, setBookingsLoaded] = useState(false);

  const [weekStart, setWeekStart] = useState(getMondayOfWeek(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [pending, setPending] = useState<PendingMap>(new Map());
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState<PublishedSummary | null>(null);
  const [error, setError] = useState("");
  const [existingSlots, setExistingSlots] = useState<Map<string, SlotInfo>>(new Map());
  const [customTime, setCustomTime] = useState("");
  const [customTimeError, setCustomTimeError] = useState("");

  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const weekDays = getWeekDays(weekStart);
  const weekNumber = getWeekNumber(weekStart);

  // Hent salene til klubben, så eksisterende tider for den første
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("club_id").eq("id", user.id).single();
      const clubId = (profile as any)?.club_id;
      if (!clubId) { setRoomsLoading(false); return; }
      const { data: roomRows } = await supabase
        .from("rooms")
        .select("id, name")
        .eq("club_id", clubId)
        .order("sort_order");
      setRooms(roomRows ?? []);
      const first = roomRows?.[0]?.id ?? null;
      setActiveRoom(first);
      setRoomsLoading(false);
      if (first) fetchExistingSlots(first, today);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchExistingSlots(roomId: string, date: Date) {
    const supabase = createClient();
    const dateStr = dateToISO(date);
    const dayStart = new Date(`${dateStr}T00:00:00`).toISOString();
    const dayEnd = new Date(`${dateStr}T23:59:59`).toISOString();

    const { data: slots } = await supabase
      .from("room_slots")
      .select("start_at, is_booked, room_bookings(id, dancer_name, status, booker_id)")
      .eq("room_id", roomId)
      .gte("start_at", dayStart)
      .lte("start_at", dayEnd);

    const map = new Map<string, SlotInfo>();
    for (const s of slots ?? []) {
      const d = new Date(s.start_at);
      const key = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      const booking = ((s as any).room_bookings ?? []).find((b: any) => b.status === "confirmed");
      map.set(key, {
        isBooked: !!s.is_booked,
        bookingId: booking?.id,
        dancerName: booking?.dancer_name,
        bookerId: booking?.booker_id,
      });
    }
    setExistingSlots(map);
  }

  async function fetchBookings() {
    setBookingsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("room_bookings")
      .select("id, dancer_name, booker_id, room_slots(start_at, end_at, rooms(name))")
      .eq("status", "confirmed");
    const now = new Date();
    const upcoming = ((data ?? []) as any[])
      .filter(b => b.room_slots && new Date(b.room_slots.end_at) >= now)
      .sort((a, b) => a.room_slots.start_at.localeCompare(b.room_slots.start_at));
    setBookings(upcoming);
    setBookingsLoading(false);
    setBookingsLoaded(true);
  }

  function openBookingsTab() {
    setPageTab("bookings");
    if (!bookingsLoaded) fetchBookings();
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");
    const supabase = createClient();

    const { error: cancelErr } = await supabase
      .from("room_bookings")
      .update({ status: "cancelled" })
      .eq("id", cancelTarget.bookingId);

    if (cancelErr) {
      setCancelError("Noe gikk galt, prøv igjen");
      setCancelling(false);
      return;
    }

    const start = new Date(cancelTarget.startAt);
    const message = `Treneren har avbestilt ${cancelTarget.roomName} til egentrening – ${start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })} kl. ${start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}`;
    await supabase.from("notifications").insert({ user_id: cancelTarget.bookerId, message });
    fetch("/api/notify-trainer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainerId: cancelTarget.bookerId, message }),
    }).catch(() => {});

    setCancelling(false);
    setCancelTarget(null);
    if (activeRoom && selectedDate) fetchExistingSlots(activeRoom, selectedDate);
    if (bookingsLoaded) fetchBookings();
  }

  // Bytte sal beholder valgene du har gjort i andre saler – de forsvinner
  // først når du publiserer (eller laster siden på nytt).
  function pickRoom(roomId: string) {
    setActiveRoom(roomId);
    setPublished(null);
    setError("");
    if (selectedDate) fetchExistingSlots(roomId, selectedDate);
  }

  function prevWeek() {
    if (!activeRoom) return;
    const prev = new Date(weekStart);
    prev.setDate(weekStart.getDate() - 7);
    if (prev >= getMondayOfWeek(today)) {
      setWeekStart(prev);
      const days = getWeekDays(prev);
      const firstAvailable = days.find((d) => d >= today) ?? days[0];
      setSelectedDate(firstAvailable);
      setPublished(null);
      fetchExistingSlots(activeRoom, firstAvailable);
    }
  }

  function nextWeek() {
    if (!activeRoom) return;
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + 7);
    setWeekStart(next);
    const days = getWeekDays(next);
    const firstAvailable = days.find((d) => d >= today) ?? days[0];
    setSelectedDate(firstAvailable);
    setPublished(null);
    fetchExistingSlots(activeRoom, firstAvailable);
  }

  async function pickDate(date: Date) {
    if (date < today || !activeRoom) return;
    setSelectedDate(date);
    setPublished(null);
    setError("");
    setCustomTime("");
    setCustomTimeError("");
    await fetchExistingSlots(activeRoom, date);
  }

  function toggleSlot(slot: string) {
    if (!selectedDate || !activeRoom) return;
    const dateKey = dateToISO(selectedDate);
    setPending((prev) => {
      const next = new Map(prev);
      const byDate = new Map(next.get(activeRoom) ?? []);
      const daySlots = new Set(byDate.get(dateKey) ?? []);
      daySlots.has(slot) ? daySlots.delete(slot) : daySlots.add(slot);
      if (daySlots.size === 0) byDate.delete(dateKey); else byDate.set(dateKey, daySlots);
      if (byDate.size === 0) next.delete(activeRoom); else next.set(activeRoom, byDate);
      return next;
    });
  }

  function addCustomTime() {
    if (!selectedDate || !activeRoom || !customTime) return;
    if (existingSlots.has(customTime)) { setCustomTimeError("Allerede publisert"); return; }
    const isToday = dateToISO(selectedDate) === dateToISO(today);
    if (isToday) {
      const [h, m] = customTime.split(":").map(Number);
      const slotTime = new Date();
      slotTime.setHours(h, m, 0, 0);
      if (slotTime <= new Date()) { setCustomTimeError("Tidspunktet er passert"); return; }
    }
    setCustomTimeError("");
    const dateKey = dateToISO(selectedDate);
    setPending((prev) => {
      const next = new Map(prev);
      const byDate = new Map(next.get(activeRoom) ?? []);
      const daySlots = new Set(byDate.get(dateKey) ?? []);
      daySlots.add(customTime);
      byDate.set(dateKey, daySlots);
      next.set(activeRoom, byDate);
      return next;
    });
    setCustomTime("");
  }

  const dateKey = selectedDate ? dateToISO(selectedDate) : "";
  const selectedToday = getRoomDay(pending, activeRoom, dateKey);
  const totalPending = countAll(pending);
  const roomsWithPending = rooms.filter(r => countForRoom(pending, r.id) > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (totalPending === 0) return;
    setSaving(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const rows: { room_id: string; start_at: string; end_at: string }[] = [];
    for (const [roomId, byDate] of pending.entries()) {
      for (const [dk, times] of byDate.entries()) {
        const baseDate = new Date(`${dk}T00:00:00`);
        for (const time of times) {
          const [hours, minutes] = time.split(":").map(Number);
          const start = new Date(baseDate);
          start.setHours(hours, minutes, 0, 0);
          const end = new Date(start.getTime() + 30 * 60 * 1000);
          rows.push({ room_id: roomId, start_at: start.toISOString(), end_at: end.toISOString() });
        }
      }
    }
    const { error: insertError } = await supabase.from("room_slots").insert(rows);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("En eller flere av tidene du valgte finnes allerede. Oppdater siden og prøv igjen.");
      } else {
        setError("Noe gikk galt: " + insertError.message);
      }
      setSaving(false);
      return;
    }

    const { data: trainerProfile } = await supabase
      .from("profiles")
      .select("name, club_id")
      .eq("id", user.id)
      .single();

    const { data: recipients } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["dancer", "parent"])
      .or("notify_new_slots.is.null,notify_new_slots.eq.true")
      .eq("club_id", trainerProfile?.club_id ?? "");

    const roomNames = roomsWithPending.map(r => r.name).join(", ");

    if (recipients && recipients.length > 0) {
      const trainerName = trainerProfile?.name ?? "Treneren";
      const uniqueDates = [...new Set(rows.map(r => {
        const d = new Date(r.start_at);
        return d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
      }))];
      const dateStr = uniqueDates.join(", ");
      const message = `${trainerName} har lagt ut ${rows.length} ledig${rows.length === 1 ? "" : "e"} tid${rows.length === 1 ? "" : "er"} i ${roomNames} til egentrening: ${dateStr}`;
      const notifRows = recipients.map(r => ({ user_id: r.id, message }));
      await supabase.from("notifications").insert(notifRows);

      // Send push-varsel til dansere/foreldre
      fetch("/api/notify-new-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: recipients.map(r => r.id),
          message,
        }),
      }).catch(() => {});
    }

    setPending(new Map());
    setSaving(false);
    setPublished({ count: rows.length, roomNames });
    if (activeRoom && selectedDate) fetchExistingSlots(activeRoom, selectedDate);
  }

  const slots = selectedDate ? getSlotsForDate(selectedDate) : [];

  if (roomsLoading) {
    return <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 page-safe-top text-gray-400 text-sm">Laster…</main>;
  }

  if (rooms.length === 0) {
    return (
      <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 page-safe-top">
        <div className="max-w-lg mx-auto">
          <button onClick={() => router.push("/trainer/dashboard")} className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200 mb-2 -ml-2">
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <h1 className="font-display text-[28px] mb-6">Legg ut ledige tider – saler</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Klubben din har ingen saler satt opp ennå.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 page-safe-top">
      <div className="max-w-lg mx-auto">
        <button onClick={() => router.push("/trainer/dashboard")} className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200 mb-2 -ml-2">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="font-display text-[28px] mb-6">Legg ut ledige tider – saler</h1>

        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-5">
          <button onClick={() => setPageTab("publish")} className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pageTab === "publish" ? "bg-white dark:bg-gray-900 text-[#c87de0] shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
            Legg ut tider
          </button>
          <button onClick={openBookingsTab} className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pageTab === "bookings" ? "bg-white dark:bg-gray-900 text-[#c87de0] shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
            Bookinger {bookings.length > 0 && `(${bookings.length})`}
          </button>
        </div>

        {pageTab === "bookings" && (
          <div className="space-y-3">
            {bookingsLoading ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Laster…</p>
            ) : bookings.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500">
                Ingen kommende sal-bookinger i noen av salene
              </div>
            ) : (
              bookings.map(b => {
                const slot = b.room_slots;
                if (!slot) return null;
                const start = new Date(slot.start_at);
                return (
                  <Card key={b.id}>
                    <CardContent className="py-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm">{slot.rooms?.name ?? "Sal"} – {b.dancer_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "short" })} kl.{" "}
                          {start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}–
                          {new Date(slot.end_at).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="text-red-500 border-red-200 dark:border-red-900 shrink-0"
                        onClick={() => setCancelTarget({
                          bookingId: b.id,
                          dancerName: b.dancer_name,
                          bookerId: b.booker_id,
                          roomName: slot.rooms?.name ?? "Sal",
                          startAt: slot.start_at,
                        })}
                      >
                        Avbestill
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {pageTab === "publish" && (
        <>
        {/* Sal-velger */}
        {rooms.length > 1 && (
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
            {rooms.map(r => {
              const count = countForRoom(pending, r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => pickRoom(r.id)}
                  className={`relative flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeRoom === r.id
                      ? "bg-white dark:bg-gray-900 text-[#c87de0] shadow-sm"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {r.name}
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#E2A9F1] text-[#3A3A3A] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {roomsWithPending.length > 1 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Du har valgt tider i flere saler ({roomsWithPending.map(r => r.name).join(", ")}) – alt publiseres samlet når du trykker «Publiser».
          </p>
        )}

        <Card className="mb-4">
          <CardContent className="pt-4">
            {/* Måneds-/årsvelger */}
            <div className="mb-3">
              <select
                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                value={`${weekStart.getFullYear()}-${weekStart.getMonth()}`}
                onChange={(e) => {
                  if (!activeRoom) return;
                  const [year, month] = e.target.value.split("-").map(Number);
                  const firstOfMonth = new Date(year, month, 1);
                  const monday = getMondayOfWeek(firstOfMonth < today ? today : firstOfMonth);
                  setWeekStart(monday);
                  const firstAvailable = getWeekDays(monday).find(d => d >= today) ?? getWeekDays(monday)[0];
                  setSelectedDate(firstAvailable);
                  fetchExistingSlots(activeRoom, firstAvailable);
                }}
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
                  return (
                    <option key={i} value={`${d.getFullYear()}-${d.getMonth()}`}>
                      {d.toLocaleDateString("nb-NO", { month: "long", year: "numeric" })}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center justify-between mb-4">
              <button onClick={prevWeek} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 text-xl">‹</button>
              <span className="font-semibold text-gray-700 dark:text-gray-300">Uke {weekNumber}</span>
              <button onClick={nextWeek} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 text-xl">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, i) => {
                const isPast = day < today;
                const isSelected = selectedDate && dateToISO(day) === dateToISO(selectedDate);
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
                        ? "bg-[#edd5f9] dark:bg-[#E2A9F1]/15 text-[#c87de0] hover:bg-[#E2A9F1]/30"
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

        {selectedDate && published && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="font-display text-[28px] mb-2">Publisert!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {published.count} ledig{published.count === 1 ? "" : "e"} tid{published.count === 1 ? "" : "er"} i {published.roomNames} er nå klare for booking.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setPublished(null)}
              >
                Legg ut flere tider
              </Button>
            </CardContent>
          </Card>
        )}

        {selectedDate && !published && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base capitalize">
                {selectedDate.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
                <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">
                  {isWeekend(selectedDate) ? "09:00–21:00" : "14:00–21:00"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot) => {
                    const info = existingSlots.get(slot);
                    const isExisting = !!info;
                    const isBooked = !!info?.isBooked && !!info?.bookingId;
                    const isSelected = selectedToday.has(slot);
                    const isToday = selectedDate && dateToISO(selectedDate) === dateToISO(today);
                    const isPastSlot = isToday && (() => {
                      const [h, m] = slot.split(":").map(Number);
                      const slotTime = new Date();
                      slotTime.setHours(h, m, 0, 0);
                      return slotTime <= new Date();
                    })();
                    const disabled = (isExisting && !isBooked) || isPastSlot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          if (isBooked && info?.bookingId && info.bookerId && selectedDate && activeRoom) {
                            const [h, m] = slot.split(":").map(Number);
                            const startAt = new Date(selectedDate);
                            startAt.setHours(h, m, 0, 0);
                            setCancelTarget({
                              bookingId: info.bookingId,
                              dancerName: info.dancerName ?? "",
                              bookerId: info.bookerId,
                              roomName: rooms.find(r => r.id === activeRoom)?.name ?? "Sal",
                              startAt: startAt.toISOString(),
                            });
                            return;
                          }
                          if (!disabled) toggleSlot(slot);
                        }}
                        disabled={disabled && !isBooked}
                        title={isBooked ? `Booket av ${info?.dancerName} – trykk for å avbestille` : isExisting ? "Allerede publisert" : isPastSlot ? "Tidspunktet er passert" : undefined}
                        className={`py-2 px-1 rounded-lg text-sm font-medium border transition-colors ${
                          isBooked
                            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900 hover:border-amber-400"
                            : isExisting
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-800 cursor-not-allowed line-through"
                            : isPastSlot
                            ? "bg-gray-50 dark:bg-gray-950 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-800 cursor-not-allowed"
                            : isSelected
                            ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A]"
                            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#E2A9F1]"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 align-[-1px] mr-1" />
                  Booket – trykk på tiden for å se hvem og avbestille
                </p>

                {(() => {
                  const customTimesForDay = Array.from(selectedToday).filter(t => !slots.includes(t)).sort();
                  if (customTimesForDay.length === 0) return null;
                  return (
                    <div className="flex flex-wrap gap-2">
                      {customTimesForDay.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleSlot(t)}
                          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-sm font-medium border bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A]"
                        >
                          {t} ✕
                        </button>
                      ))}
                    </div>
                  );
                })()}

                <div className="border-t dark:border-gray-700 pt-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Egendefinert tid utenom listen over</p>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => { setCustomTime(e.target.value); setCustomTimeError(""); }}
                      className="flex-1 border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={addCustomTime}
                      disabled={!customTime}
                      className="px-4 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      + Legg til
                    </button>
                  </div>
                  {customTimeError && <p className="text-xs text-red-500 mt-1">{customTimeError}</p>}
                </div>

                {selectedToday.size > 0 && (
                  <p className="text-sm text-[#E2A9F1]">
                    {selectedToday.size} valgt denne dagen
                  </p>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button
                  type="submit"
                  className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white"
                  disabled={saving || totalPending === 0}
                >
                  {saving ? "Lagrer..." : `Publiser ${totalPending > 0 ? totalPending + " " : ""}time${totalPending !== 1 ? "r" : ""}${roomsWithPending.length > 1 ? ` i ${roomsWithPending.length} saler` : ""}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
        </>
        )}
      </div>

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => !cancelling && setCancelTarget(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-xs p-6 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Booket av</p>
            <p className="font-display text-[26px] mb-5">{cancelTarget.dancerName}</p>
            {cancelError && <p className="text-sm text-red-500 mb-3">{cancelError}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCancelTarget(null)} disabled={cancelling}>
                Lukk
              </Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={confirmCancel} disabled={cancelling}>
                {cancelling ? "…" : "Avbestill"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
