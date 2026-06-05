"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

interface Props {
  slots: Slot[];
  trainerId: string;
  bookerId: string;
  bookerName: string;
  bookerRole: string;
  danceStyles: string[];
  children: Child[];
}

function groupByDate(slots: Slot[]) {
  const groups: Record<string, Slot[]> = {};
  for (const slot of slots) {
    const date = new Date(slot.start_at).toLocaleDateString("nb-NO", {
      weekday: "long", day: "numeric", month: "long"
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(slot);
  }
  return groups;
}

export default function BookingForm({ slots, bookerId, bookerName, bookerRole, danceStyles, children }: Props) {
  const router = useRouter();
  const isParent = bookerRole === "parent";
  const isDouble = (style: string) => DOUBLE_STYLES.includes(style);

  const autoFill = isParent && children.length === 1 ? children[0].name : "";
  const [childrenList, setChildrenList] = useState<Child[]>(children);
  const [addingChild, setAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [savingChild, setSavingChild] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Uke-navigasjon
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

  const today = new Date(); today.setHours(0,0,0,0);
  const canGoPrev = weekStart > getMonday(today);
  const [dancer1, setDancer1] = useState(isParent ? autoFill : bookerName);
  const [dancer2, setDancer2] = useState("");
  const [danceStyle, setDanceStyle] = useState("");
  const [step, setStep] = useState<"pick" | "confirm">("pick");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAddChild() {
    if (!newChildName.trim()) return;
    setSavingChild(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("children").insert({ parent_id: user.id, name: newChildName.trim() }).select().single();
    if (data) {
      setChildrenList(prev => [...prev, data]);
      setDancer1(data.name);
    }
    setNewChildName("");
    setAddingChild(false);
    setSavingChild(false);
  }

  const grouped = groupByDate(slots);
  const needsTwoNames = isDouble(danceStyle);
  const dancerNameForBooking = needsTwoNames ? `${dancer1} & ${dancer2}` : dancer1;
  const canSubmit = danceStyle && dancer1 && (!needsTwoNames || dancer2);

  async function handleBook() {
    if (!selectedSlot || !canSubmit) return;
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error: bookError } = await supabase.from("bookings").insert({
      slot_id: selectedSlot.id,
      booker_id: bookerId,
      dancer_name: dancerNameForBooking,
      dance_style: danceStyle,
      status: "confirmed",
    });

    if (bookError) {
      setError("Noe gikk galt, prøv igjen");
      setLoading(false);
      return;
    }

    await supabase
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", selectedSlot.id);

    const start = new Date(selectedSlot.start_at);
    const tidspunkt = start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" }) +
      " kl. " + start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });

    const { data: slotData } = await supabase
      .from("availability_slots")
      .select("trainer_id")
      .eq("id", selectedSlot.id)
      .single();

    if (slotData) {
      await supabase.from("notifications").insert({
        user_id: slotData.trainer_id,
        message: `${dancerNameForBooking} har booket time i ${danceStyle} – ${tidspunkt}`,
      });
    }

    router.push("/booking/kvittering?success=1");
  }

  if (step === "confirm" && selectedSlot) {
    const start = new Date(selectedSlot.start_at);
    const end = new Date(selectedSlot.end_at);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bekreft booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <p className="text-sm text-gray-500">Tid</p>
            <p className="font-medium capitalize">
              {start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="text-gray-600">
              {start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}–{end.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Dansestil</label>
            <div className="grid grid-cols-2 gap-2">
              {danceStyles.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => { setDanceStyle(style); setDancer2(""); }}
                  className={`py-2 px-3 rounded-lg text-sm border transition-colors ${
                    danceStyle === style
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-purple-400"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {isParent && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {needsTwoNames ? "Danser 1 – navn" : "Danserens navn"}
              </label>
              {childrenList.length > 1 ? (
                <select
                  value={dancer1}
                  onChange={(e) => setDancer1(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  required
                >
                  <option value="">Velg danser</option>
                  {childrenList.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <Input
                  value={dancer1}
                  onChange={(e) => setDancer1(e.target.value)}
                  placeholder="Navn på danseren"
                />
              )}

            </div>
          )}

          {needsTwoNames && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isParent ? "Danser 2 – navn" : "Navn på partner"}
              </label>
              <Input
                value={dancer2}
                onChange={(e) => setDancer2(e.target.value)}
                placeholder="Navn på danser nr. 2"
              />
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">Betaling</p>
            <p className="text-sm text-blue-700">
              Betaling er som før i <strong>Spond</strong>.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={handleBook}
            disabled={loading || !canSubmit}
          >
            {loading ? "Booker..." : "Bekreft booking"}
          </Button>
          <button
            type="button"
            onClick={() => setStep("pick")}
            className="w-full text-sm text-gray-400 hover:text-gray-600"
          >
            Gå tilbake
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Uke-navigasjon */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => { const p = new Date(weekStart); p.setDate(p.getDate()-7); setWeekStart(p); }}
          disabled={!canGoPrev}
          className={`text-2xl px-2 ${canGoPrev ? "text-gray-600 hover:text-purple-600" : "text-gray-200"}`}
        >‹</button>
        <span className="font-semibold text-gray-700">Uke {getWeekNumber(weekStart)}</span>
        <button
          type="button"
          onClick={() => { const n = new Date(weekStart); n.setDate(n.getDate()+7); setWeekStart(n); }}
          className="text-2xl px-2 text-gray-600 hover:text-purple-600"
        >›</button>
      </div>

      {Object.keys(weekGrouped).length === 0 ? (
        <div className="bg-white rounded-xl border p-6 text-center text-gray-400">
          <p className="font-medium">Treneren har ikke lagt ut ledige privattimer ennå</p>
          <p className="text-sm mt-1">Prøv en annen uke</p>
        </div>
      ) : (
        Object.entries(weekGrouped).map(([date, daySlots]) => (
          <div key={date}>
            <p className="text-sm font-medium text-gray-500 capitalize mb-2">{date}</p>
            <div className="grid grid-cols-3 gap-2">
              {daySlots.map((slot) => {
                const start = new Date(slot.start_at);
                const time = start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
                const isSelected = selectedSlot?.id === slot.id;
                const isBooked = slot.is_booked;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => !isBooked && setSelectedSlot(slot)}
                    disabled={isBooked}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      isBooked
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through"
                        : isSelected
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-purple-400"
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

      <Button
        className="w-full bg-purple-600 hover:bg-purple-700"
        disabled={!selectedSlot}
        onClick={() => setStep("confirm")}
      >
        Gå videre
      </Button>
    </div>
  );
}
