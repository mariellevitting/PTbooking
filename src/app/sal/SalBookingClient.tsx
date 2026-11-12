"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatTime, formatDateKey } from "@/lib/dateUtils";

interface Room {
  id: string;
  name: string;
}

interface SlotRow {
  id: string;
  room_id: string;
  start_at: string;
  end_at: string;
  is_booked: boolean;
}

interface Child {
  id: string;
  name: string;
}

interface MyBooking {
  id: string;
  dancer_name: string;
  room_slots: { start_at: string; end_at: string; rooms: { name: string } | null } | null;
}

interface Props {
  rooms: Room[];
  allSlots: SlotRow[];
  userId: string;
  userName: string;
  role: string;
  clubId: string | null;
  kids: Child[];
  myBookings: MyBooking[];
  backHref: string;
}

interface BookedInfo {
  count: number;
  dancerName: string;
}

// Varsler trenere i klubben som har skrudd på "Egentrening i saler"-varsler.
async function notifyTrainers(supabase: ReturnType<typeof createClient>, clubId: string | null, message: string) {
  if (!clubId) return;
  const { data: trainers } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "trainer")
    .eq("club_id", clubId)
    .or("notify_room_activity.is.null,notify_room_activity.eq.true");
  if (!trainers || trainers.length === 0) return;
  await supabase.from("notifications").insert(trainers.map(t => ({ user_id: t.id, message })));
  fetch("/api/notify-new-slots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds: trainers.map(t => t.id), message }),
  }).catch(() => {});
}

export default function SalBookingClient({ rooms, allSlots, userId, userName, role, clubId, kids, myBookings, backHref }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"book" | "mine">("book");
  const [activeRoom, setActiveRoom] = useState<string>(rooms[0]?.id ?? "");
  // Hver "gruppe" er 1 eller 2 sammenhengende 30-min-blokker (maks 60 min,
  // samme sal). Flere grupper kan velges samtidig – også på tvers av
  // dager/saler – og publiseres/bookes samlet.
  const [selectedGroups, setSelectedGroups] = useState<SlotRow[][]>([]);
  const [dancerChoice, setDancerChoice] = useState<string>(role === "parent" && kids.length === 1 ? kids[0].name : role === "dancer" ? userName : "");
  const [customName, setCustomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [bookedInfo, setBookedInfo] = useState<BookedInfo | null>(null);

  const roomSlots = useMemo(
    () => allSlots.filter(s => s.room_id === activeRoom).sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [allSlots, activeRoom]
  );

  const groupedByDay = useMemo(() => {
    const map = new Map<string, SlotRow[]>();
    for (const s of roomSlots) {
      const key = formatDateKey(new Date(s.start_at));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [roomSlots]);

  // Bytte sal beholder valgene du har gjort i andre saler.
  function pickRoom(roomId: string) {
    setActiveRoom(roomId);
    setBookedInfo(null);
  }

  function toggleSlot(slot: SlotRow) {
    if (slot.is_booked) return;
    setBookedInfo(null);

    const groupIdx = selectedGroups.findIndex(g => g.some(s => s.id === slot.id));
    if (groupIdx !== -1) {
      // allerede valgt – fjern den (fra et par blir det ett enkelt igjen)
      const next = selectedGroups
        .map((g, i) => (i === groupIdx ? g.filter(s => s.id !== slot.id) : g))
        .filter(g => g.length > 0);
      setSelectedGroups(next);
      return;
    }

    // kan den utvide en eksisterende enkelt-blokk til 60 min (samme sal, naboblokk)?
    const mergeIdx = selectedGroups.findIndex(g =>
      g.length === 1 && g[0].room_id === slot.room_id &&
      Math.abs(new Date(slot.start_at).getTime() - new Date(g[0].start_at).getTime()) === 30 * 60 * 1000
    );
    if (mergeIdx !== -1) {
      const next = selectedGroups.map((g, i) =>
        i === mergeIdx ? [...g, slot].sort((a, b) => a.start_at.localeCompare(b.start_at)) : g
      );
      setSelectedGroups(next);
      return;
    }

    // ellers: ny, uavhengig gruppe (f.eks. en annen dag eller sal)
    setSelectedGroups([...selectedGroups, [slot]]);
  }

  function removeGroup(idx: number) {
    setSelectedGroups(selectedGroups.filter((_, i) => i !== idx));
  }

  const finalDancerName = dancerChoice === "__custom__" ? customName.trim() : dancerChoice.trim();
  const canConfirm = selectedGroups.length > 0 && finalDancerName.length > 0 && !loading;

  async function confirmBooking() {
    if (!canConfirm) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const allSlotsFlat = selectedGroups.flat();
    const rows = allSlotsFlat.map(s => ({
      slot_id: s.id,
      booker_id: userId,
      dancer_name: finalDancerName,
    }));
    const { error } = await supabase.from("room_bookings").insert(rows);
    if (error) {
      setLoading(false);
      setError(error.message.includes("duplicate") || error.message.includes("unique")
        ? "Noen rakk å booke en av disse tidene akkurat nå. Prøv igjen."
        : error.message);
      return;
    }

    const roomNames = [...new Set(selectedGroups.map(g => rooms.find(r => r.id === g[0].room_id)?.name).filter(Boolean))].join(", ");
    const dateStrs = [...new Set(allSlotsFlat.map(s => formatDate(new Date(s.start_at), { weekday: "long", day: "numeric", month: "short" })))].join(", ");
    const message = `${finalDancerName} har booket ${roomNames} til egentrening – ${dateStrs}`;
    await notifyTrainers(supabase, clubId, message);

    setSelectedGroups([]);
    setLoading(false);
    setBookedInfo({ count: selectedGroups.length, dancerName: finalDancerName });
    router.refresh();
  }

  async function cancelBooking(id: string) {
    setCancellingId(id);
    const supabase = createClient();
    const booking = myBookings.find(b => b.id === id);
    await supabase.from("room_bookings").update({ status: "cancelled" }).eq("id", id);
    if (booking?.room_slots) {
      const start = new Date(booking.room_slots.start_at);
      const message = `${booking.dancer_name} har avbestilt ${booking.room_slots.rooms?.name ?? "sal"} til egentrening – ${formatDate(start, { weekday: "long", day: "numeric", month: "short" })} kl. ${formatTime(start)}`;
      await notifyTrainers(supabase, clubId, message);
    }
    setCancellingId(null);
    router.refresh();
  }

  const roomName = rooms.find(r => r.id === activeRoom)?.name ?? "";

  return (
    <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-10 page-safe-top min-h-screen">
      <div className="max-w-lg mx-auto">
        <Link href={backHref} className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200 mb-2 -ml-2">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </Link>
        <h1 className="font-display text-[28px] mb-6">Sal til egentrening</h1>

        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-5">
          <button onClick={() => setTab("book")} className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "book" ? "bg-white dark:bg-gray-900 text-[#c87de0] shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
            Book sal
          </button>
          <button onClick={() => setTab("mine")} className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "mine" ? "bg-white dark:bg-gray-900 text-[#c87de0] shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
            Mine bookinger {myBookings.length > 0 && `(${myBookings.length})`}
          </button>
        </div>

        {tab === "mine" && (
          <div className="space-y-3">
            {myBookings.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500">
                Ingen kommende sal-bookinger
              </div>
            ) : (
              myBookings.map(b => {
                const slot = b.room_slots;
                if (!slot) return null;
                const start = new Date(slot.start_at);
                return (
                  <Card key={b.id}>
                    <CardContent className="py-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm">{slot.rooms?.name ?? "Sal"} – {b.dancer_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(start, { weekday: "long", day: "numeric", month: "short" })} kl. {formatTime(start)}–{formatTime(new Date(slot.end_at))}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="text-red-500 border-red-200 dark:border-red-900 shrink-0"
                        disabled={cancellingId === b.id}
                        onClick={() => cancelBooking(b.id)}
                      >
                        {cancellingId === b.id ? "…" : "Avbestill"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {tab === "book" && bookedInfo && (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="font-display text-[28px] mb-2">Booket!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              {bookedInfo.count === 1 ? "Økten er" : `Alle ${bookedInfo.count} øktene er`} reservert til {bookedInfo.dancerName}. Se under «Mine bookinger».
            </p>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setBookedInfo(null)}>
                Book en til
              </Button>
              <Button className="flex-1 bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white" onClick={() => { setBookedInfo(null); setTab("mine"); }}>
                Mine bookinger
              </Button>
            </div>
          </div>
        )}

        {tab === "book" && !bookedInfo && (
          <>
            {rooms.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500">
                Klubben din har ingen saler satt opp ennå.
              </div>
            ) : (
              <>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4">
                  {rooms.map(r => (
                    <button
                      key={r.id}
                      onClick={() => pickRoom(r.id)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeRoom === r.id ? "bg-white dark:bg-gray-900 text-[#c87de0] shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>

                {groupedByDay.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500">
                    Ingen tider lagt ut i {roomName} ennå
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupedByDay.map(([dateKey, daySlots]) => (
                      <div key={dateKey}>
                        <p className="text-sm font-semibold mb-2 capitalize">
                          {formatDate(new Date(daySlots[0].start_at), { weekday: "long", day: "numeric", month: "short" })}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {daySlots.map(s => {
                            const isSelected = selectedGroups.some(g => g.some(sel => sel.id === s.id));
                            return (
                              <button
                                key={s.id}
                                onClick={() => toggleSlot(s)}
                                disabled={s.is_booked}
                                title={s.is_booked ? "Opptatt" : undefined}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                  s.is_booked
                                    ? "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-800 cursor-not-allowed line-through"
                                    : isSelected
                                    ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A] dark:bg-[#c87de0] dark:text-white dark:border-[#c87de0]"
                                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                                }`}
                              >
                                {formatTime(new Date(s.start_at))}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedGroups.length > 0 && (
                  <Card className="mt-5">
                    <CardContent className="pt-5 space-y-4">
                      <div className="space-y-2">
                        {selectedGroups.map((g, i) => {
                          const gRoomName = rooms.find(r => r.id === g[0].room_id)?.name ?? "";
                          return (
                            <div key={g[0].id} className="flex items-center justify-between bg-[#f5eeff] dark:bg-[#E2A9F1]/10 rounded-lg px-3 py-2">
                              <div>
                                <p className="text-sm font-semibold capitalize">
                                  {gRoomName}, {formatDate(new Date(g[0].start_at), { weekday: "long", day: "numeric", month: "short" })}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTime(new Date(g[0].start_at))}–{formatTime(new Date(g[g.length - 1].end_at))} ({g.length * 30} min)
                                </p>
                              </div>
                              <button type="button" onClick={() => removeGroup(i)} className="text-xs text-red-400 hover:text-red-600 shrink-0 ml-2">
                                Fjern
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* "Hvem skal trene?" trengs bare når det faktisk er noe å velge mellom:
                          danser = alltid seg selv, forelder med ett barn = det barnet automatisk. */}
                      {role === "parent" && kids.length > 1 && (
                        <div>
                          <label className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1.5 block">Hvem skal trene?</label>
                          <div className="flex flex-wrap gap-2">
                            {kids.map(c => (
                              <button
                                key={c.id}
                                onClick={() => setDancerChoice(c.name)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${dancerChoice === c.name ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A] dark:bg-[#c87de0] dark:text-white dark:border-[#c87de0]" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"}`}
                              >
                                {c.name}
                              </button>
                            ))}
                            <button
                              onClick={() => setDancerChoice("__custom__")}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${dancerChoice === "__custom__" ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A] dark:bg-[#c87de0] dark:text-white dark:border-[#c87de0]" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"}`}
                            >
                              Annen danser
                            </button>
                          </div>
                          {dancerChoice === "__custom__" && (
                            <input
                              value={customName}
                              onChange={e => setCustomName(e.target.value)}
                              placeholder="Navn på danser"
                              className="mt-2 w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            />
                          )}
                        </div>
                      )}

                      {role === "parent" && kids.length === 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1.5 block">Hvem skal trene?</label>
                          <input
                            value={dancerChoice}
                            onChange={e => setDancerChoice(e.target.value)}
                            placeholder="Navn på danser"
                            className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </div>
                      )}

                      {error && <p className="text-sm text-red-500">{error}</p>}

                      <Button
                        onClick={confirmBooking}
                        disabled={!canConfirm}
                        className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white"
                      >
                        {loading ? "Booker…" : selectedGroups.length > 1 ? `Bekreft ${selectedGroups.length} bookinger` : "Bekreft booking"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
