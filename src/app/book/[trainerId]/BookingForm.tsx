"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { styleColor } from "@/lib/danceStyleColors";

const DOUBLE_STYLES = ["Freestyle dobbel", "Slow dobbel"];

interface Slot {
  id: string;
  start_at: string;
  end_at: string;
  is_booked: boolean;
}

interface Child {
  id: string;
  name: string;
}

interface LinkedUser {
  id: string;
  name: string;
  role: string;
}

interface SlotBooking {
  slot: Slot;
  danceStyle: string;
  dancer1: string;
  dancer2: string;
  linkedUserId: string | null;
}

interface Props {
  slots: Slot[];
  trainerId: string;
  trainerName: string;
  bookerId: string;
  bookerName: string;
  bookerRole: string;
  danceStyles: string[];
  children: Child[];
  price: number;
  paymentLabel?: string | null;
  clubId?: string | null;
}

export default function BookingForm({ slots, trainerName, bookerId, bookerName, bookerRole, danceStyles, children, price, paymentLabel, clubId }: Props) {
  const router = useRouter();
  const isParent = bookerRole === "parent";
  const isDouble = (style: string) => DOUBLE_STYLES.includes(style);
  const autoFill = isParent && children.length === 1 ? children[0].name : "";

  const [childrenList, setChildrenList] = useState<Child[]>(children);
  const [newChildName, setNewChildName] = useState("");
  const [addingChild, setAddingChild] = useState(false);
  const [savingChild, setSavingChild] = useState(false);

  const [step, setStep] = useState<"pick" | "configure" | "confirm">("pick");
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [slotBookings, setSlotBookings] = useState<SlotBooking[]>([]);
  const [configIndex, setConfigIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Partner search state
  const [partnerQuery, setPartnerQuery] = useState("");
  const [partnerResults, setPartnerResults] = useState<LinkedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [linkedPartner, setLinkedPartner] = useState<LinkedUser | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = partnerQuery.trim();
    if (trimmed.length < 2) { setPartnerResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const supabase = createClient();
      let q = supabase
        .from("profiles")
        .select("id, name, role")
        .in("role", ["dancer", "parent"])
        .ilike("name", `%${trimmed}%`)
        .neq("id", bookerId)
        .limit(6);
      if (clubId) q = q.eq("club_id", clubId);
      const { data } = await q;
      setPartnerResults(data ?? []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [partnerQuery, bookerId, clubId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setPartnerResults([]);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectPartner(user: LinkedUser) {
    setLinkedPartner(user);
    updateCurrent("dancer2", user.name);
    updateCurrent("linkedUserId", user.id);
    setPartnerQuery("");
    setPartnerResults([]);
  }

  function clearPartner() {
    setLinkedPartner(null);
    updateCurrent("dancer2", "");
    updateCurrent("linkedUserId", null);
  }

  // Reset partner search when switching config step
  useEffect(() => {
    const current = slotBookings[configIndex];
    if (current) {
      setLinkedPartner(current.linkedUserId ? { id: current.linkedUserId, name: current.dancer2, role: "" } : null);
      setPartnerQuery("");
      setPartnerResults([]);
    }
  }, [configIndex]);

  function getMonday(date: Date) {
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function getWeekNumber(date: Date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const canGoPrev = weekStart > getMonday(today);

  const availableMonths = Array.from(
    new Set(slots.map(s => {
      const d = new Date(s.start_at);
      return `${d.getFullYear()}-${d.getMonth()}`;
    }))
  ).sort().map(key => {
    const [year, month] = key.split("-").map(Number);
    return { year, month };
  });

  const weekSlots = slots.filter(s => {
    const d = new Date(s.start_at);
    return d >= weekStart && d <= weekEnd;
  });
  const weekGrouped: Record<string, Slot[]> = {};
  for (const slot of weekSlots) {
    const date = new Date(slot.start_at).toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" });
    if (!weekGrouped[date]) weekGrouped[date] = [];
    weekGrouped[date].push(slot);
  }

  async function handleAddChild() {
    if (!newChildName.trim()) return;
    setSavingChild(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("children").insert({ parent_id: user.id, name: newChildName.trim() }).select().single();
    if (data) setChildrenList(prev => [...prev, data]);
    setNewChildName(""); setAddingChild(false); setSavingChild(false);
  }

  function startConfigure() {
    setSlotBookings(selectedSlots.map(slot => ({
      slot,
      danceStyle: "",
      dancer1: isParent ? autoFill : bookerName,
      dancer2: "",
      linkedUserId: null,
    })));
    setConfigIndex(0);
    setLinkedPartner(null);
    setStep("configure");
  }

  function updateCurrent(field: keyof SlotBooking, value: string | null) {
    setSlotBookings(prev => prev.map((sb, i) => i === configIndex ? { ...sb, [field]: value } : sb));
  }

  function nextConfig() {
    if (configIndex < slotBookings.length - 1) {
      setConfigIndex(configIndex + 1);
    } else {
      setStep("confirm");
    }
  }

  async function handleBook() {
    setLoading(true);
    setError("");
    const supabase = createClient();

    // Sjekk at ingen av slotene er blitt booket siden siden ble lastet
    const slotIds = slotBookings.map(sb => sb.slot.id);
    const { data: currentSlots } = await supabase
      .from("availability_slots")
      .select("id, start_at, is_booked")
      .in("id", slotIds);

    const takenSlot = currentSlots?.find(s => s.is_booked);
    if (takenSlot) {
      const start = new Date(takenSlot.start_at);
      const label = start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" }) +
        " kl. " + start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
      setError(`Timen ${label} ble booket av noen andre mens du valgte. Gå tilbake og velg en annen tid.`);
      setLoading(false);
      return;
    }

    for (const sb of slotBookings) {
      const dancerName = isDouble(sb.danceStyle) ? `${sb.dancer1} & ${sb.dancer2}` : sb.dancer1;

      const { error: bookError } = await supabase.from("bookings").insert({
        slot_id: sb.slot.id,
        booker_id: bookerId,
        dancer_name: dancerName,
        dance_style: sb.danceStyle,
        status: "confirmed",
        linked_user_id: sb.linkedUserId ?? null,
      });

      if (bookError) {
        setError("Noe gikk galt, prøv igjen");
        setLoading(false);
        return;
      }

      const start = new Date(sb.slot.start_at);
      const tidspunkt = start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" }) +
        " kl. " + start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });

      const { data: slotData } = await supabase.from("availability_slots").select("trainer_id").eq("id", sb.slot.id).single();
      if (slotData) {
        const notifMessage = `${dancerName} har booket time i ${sb.danceStyle} – ${tidspunkt}`;
        await supabase.from("notifications").insert({
          user_id: slotData.trainer_id,
          message: notifMessage,
        });
        // Send push-varsel til trener
        fetch("/api/notify-trainer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trainerId: slotData.trainer_id, message: notifMessage }),
        }).catch(() => {});
      }

      if (sb.linkedUserId) {
        await supabase.from("notifications").insert({
          user_id: sb.linkedUserId,
          message: `${sb.dancer1} har booket en dobbel privattime med deg i ${sb.danceStyle} – ${tidspunkt}`,
        });
      }
    }

    router.push("/booking/kvittering?success=1");
  }

  // STEG 1: Velg tider
  if (step === "pick") {
    return (
      <div className="space-y-6">
        {availableMonths.length > 1 && (
          <select
            className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
            value={`${weekStart.getFullYear()}-${weekStart.getMonth()}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split("-").map(Number);
              const firstOfMonth = new Date(year, month, 1);
              const monday = getMonday(firstOfMonth < today ? today : firstOfMonth);
              setWeekStart(monday);
            }}
          >
            {availableMonths.map(({ year, month }) => (
              <option key={`${year}-${month}`} value={`${year}-${month}`}>
                {new Date(year, month, 1).toLocaleDateString("nb-NO", { month: "long", year: "numeric" })}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center justify-between">
          <button type="button" onClick={() => { const p = new Date(weekStart); p.setDate(p.getDate() - 7); setWeekStart(p); }} disabled={!canGoPrev} className={`text-2xl px-2 ${canGoPrev ? "text-gray-600 dark:text-gray-400 hover:text-[#E2A9F1]" : "text-gray-200 dark:text-gray-700"}`}>‹</button>
          <span className="font-semibold text-gray-700 dark:text-gray-300">Uke {getWeekNumber(weekStart)}</span>
          <button type="button" onClick={() => { const n = new Date(weekStart); n.setDate(n.getDate() + 7); setWeekStart(n); }} className="text-2xl px-2 text-gray-600 dark:text-gray-400 hover:text-[#E2A9F1]">›</button>
        </div>

        {Object.keys(weekGrouped).length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500">
            <p className="font-medium">Treneren har ikke lagt ut ledige privattimer ennå</p>
            <p className="text-sm mt-1">Prøv en annen uke</p>
          </div>
        ) : (
          Object.entries(weekGrouped).map(([date, daySlots]) => (
            <div key={date}>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b dark:border-gray-700 pb-1 mb-2">{date.charAt(0).toUpperCase() + date.slice(1)}</p>
              <div className="grid grid-cols-3 gap-2">
                {daySlots.map((slot) => {
                  const time = new Date(slot.start_at).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
                  const isSelected = selectedSlots.some(s => s.id === slot.id);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        if (slot.is_booked) return;
                        setSelectedSlots(prev =>
                          prev.some(s => s.id === slot.id)
                            ? prev.filter(s => s.id !== slot.id)
                            : [...prev, slot]
                        );
                      }}
                      disabled={slot.is_booked}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        slot.is_booked
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed line-through"
                          : isSelected
                          ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A]"
                          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#E2A9F1]"
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {selectedSlots.length > 0 && (
          <p className="text-sm text-[#E2A9F1] text-center">{selectedSlots.length} time{selectedSlots.length !== 1 ? "r" : ""} valgt</p>
        )}

        <Button className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a]" disabled={selectedSlots.length === 0} onClick={startConfigure}>
          Gå videre
        </Button>
      </div>
    );
  }

  // STEG 2: Sett dansestil per time
  if (step === "configure") {
    const current = slotBookings[configIndex];
    const start = new Date(current.slot.start_at);
    const end = new Date(current.slot.end_at);
    const dayLabel = start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" });
    const needsTwo = isDouble(current.danceStyle);
    const canNext = current.danceStyle && current.dancer1 && (!needsTwo || current.dancer2);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Time {configIndex + 1} av {slotBookings.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Tid</p>
            <p className="font-semibold">{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}–{end.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Trener: {trainerName}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Dansestil</label>
            <div className="grid grid-cols-2 gap-2">
              {danceStyles.map((style) => {
                const isSelected = current.danceStyle === style;
                const c = styleColor(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => {
                      updateCurrent("danceStyle", style);
                      updateCurrent("dancer2", "");
                      updateCurrent("linkedUserId", null);
                      setLinkedPartner(null);
                      setPartnerQuery("");
                    }}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                      isSelected
                        ? `${c.bg} ${c.text} ${c.border} ${c.darkBg} ${c.darkText} ring-2 ring-offset-1 ring-current`
                        : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          {isParent && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{needsTwo ? "Danser 1 – navn" : "Danserens navn"}</label>
              {childrenList.length > 1 ? (
                <select value={current.dancer1} onChange={(e) => updateCurrent("dancer1", e.target.value)} className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-gray-300">
                  <option value="">Velg danser</option>
                  {childrenList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              ) : (
                <Input value={current.dancer1} onChange={(e) => updateCurrent("dancer1", e.target.value)} placeholder="Navn på danseren" />
              )}
              {!addingChild && <button type="button" onClick={() => setAddingChild(true)} className="text-xs text-[#E2A9F1] hover:underline">+ Legg til barn</button>}
              {addingChild && (
                <div className="flex gap-2">
                  <Input value={newChildName} onChange={(e) => setNewChildName(e.target.value)} placeholder="Navn på barn" className="text-sm" />
                  <Button type="button" onClick={handleAddChild} disabled={savingChild} className="bg-[#3A3A3A] hover:bg-[#2a2a2a] text-sm px-3">{savingChild ? "..." : "Legg til"}</Button>
                </div>
              )}
            </div>
          )}

          {needsTwo && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{isParent ? "Danser 2 – navn" : "Navn på partner"}</label>

              {linkedPartner ? (
                <div className="flex items-center justify-between bg-[#f5eeff] dark:bg-[#E2A9F1]/10 border border-[#E2A9F1]/40 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-purple-800">{linkedPartner.name}</p>
                    <p className="text-xs text-[#E2A9F1]">Koblet til profil · får varsel</p>
                  </div>
                  <button type="button" onClick={clearPartner} className="text-[#E2A9F1] hover:text-[#c87de0] ml-2">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div ref={searchRef} className="relative">
                  <input
                    type="text"
                    value={current.dancer2}
                    onChange={e => {
                      updateCurrent("dancer2", e.target.value);
                      setPartnerQuery(e.target.value);
                      setLinkedPartner(null);
                      updateCurrent("linkedUserId", null);
                    }}
                    placeholder="Skriv navn..."
                    className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900"
                    required
                  />
                  {partnerResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                      {partnerResults.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => selectPartner(u)}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#f5eeff] dark:bg-[#E2A9F1]/10 dark:hover:bg-purple-950/30 flex items-center justify-between border-t dark:border-gray-700 first:border-t-0"
                        >
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{u.name}</span>
                          <span className="text-xs text-[#E2A9F1]">Koble til profil</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Button className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a]" disabled={!canNext} onClick={nextConfig}>
            {configIndex < slotBookings.length - 1 ? "Neste time →" : "Se oppsummering"}
          </Button>
          <button type="button" onClick={() => configIndex === 0 ? setStep("pick") : setConfigIndex(configIndex - 1)} className="w-full text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 py-2">
            Gå tilbake
          </button>
        </CardContent>
      </Card>
    );
  }

  // STEG 3: Bekreft alle
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bekreft booking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {slotBookings.map((sb, i) => {
            const start = new Date(sb.slot.start_at);
            const end = new Date(sb.slot.end_at);
            const dayLabel = start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" });
            const dancerName = isDouble(sb.danceStyle) ? `${sb.dancer1} & ${sb.dancer2}` : sb.dancer1;
            return (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border-l-4 border-l-[#E2A9F1]">
                <p className="font-semibold text-sm">{dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}–{end.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-sm text-[#E2A9F1]">{sb.danceStyle} · {dancerName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Trener: {trainerName}</p>
                {sb.linkedUserId && (
                  <p className="text-xs text-green-600 mt-0.5">✓ Koblet til {sb.dancer2}s profil</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-blue-800">Betaling</p>
            <p className="text-sm font-bold text-blue-800">{slotBookings.length} × {price} kr = <span className="text-base">{slotBookings.length * price} kr</span></p>
          </div>
          <p className="text-sm text-blue-700">Betaling skjer som før i <strong>{paymentLabel || "Spond"}</strong>. Husk å send kvittering til <strong>{trainerName}</strong> etter betaling.</p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a]" onClick={handleBook} disabled={loading}>
          {loading ? "Booker..." : `Bekreft ${slotBookings.length} booking${slotBookings.length !== 1 ? "er" : ""}`}
        </Button>
        <button type="button" onClick={() => { setConfigIndex(slotBookings.length - 1); setStep("configure"); }} className="w-full text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 py-2">
          Gå tilbake
        </button>
      </CardContent>
    </Card>
  );
}
