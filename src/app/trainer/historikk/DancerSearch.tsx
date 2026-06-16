"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDate, formatTime } from "@/lib/dateUtils";

interface Slot {
  id: string;
  start_at: string;
  end_at: string;
  bookings: { id: string; dancer_name: string; dance_style: string; status: string }[] | null;
}

export default function DancerSearch({ slots }: { slots: Slot[] }) {
  const [query, setQuery] = useState("");

  const allDancers = useMemo(() => {
    const names = new Set<string>();
    for (const slot of slots) {
      const b = slot.bookings?.find(b => b.status === "confirmed");
      if (b?.dancer_name) names.add(b.dancer_name);
    }
    return Array.from(names).sort();
  }, [slots]);

  const trimmed = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!trimmed) return [];
    return slots.filter(slot =>
      slot.bookings?.some(b => b.status === "confirmed" && b.dancer_name.toLowerCase().includes(trimmed))
    ).sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());
  }, [trimmed, slots]);

  const suggestions = useMemo(() => {
    if (!trimmed || trimmed.length < 1) return [];
    return allDancers.filter(n => n.toLowerCase().includes(trimmed)).slice(0, 5);
  }, [trimmed, allDancers]);

  const showResults = trimmed.length > 0;

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Søk etter danser</p>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Skriv navn på danser..."
            className="pl-9"
          />
        </div>

        {suggestions.length > 0 && trimmed !== query.trim().toLowerCase() && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map(name => (
              <button key={name} onClick={() => setQuery(name)}
                className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-100 transition-colors">
                {name}
              </button>
            ))}
          </div>
        )}

        {showResults && (
          <div className="pt-1">
            {matches.length === 0 ? (
              <p className="text-sm text-gray-400">Ingen treff på «{query.trim()}»</p>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-sm font-semibold text-gray-800">
                    {matches.length} {matches.length === 1 ? "privattime" : "privattimer"} med {matches[0].bookings?.find(b => b.status === "confirmed")?.dancer_name ?? query.trim()}
                  </p>
                </div>
                <div className="space-y-2">
                  {matches.map(slot => {
                    const booking = slot.bookings?.find(b => b.status === "confirmed");
                    const start = new Date(slot.start_at);
                    const end = new Date(slot.end_at);
                    const dayLabel = formatDate(start, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                    return (
                      <div key={slot.id} className="flex justify-between items-center text-sm border-t pt-2">
                        <div>
                          <p className="text-gray-700 capitalize">{dayLabel}</p>
                          <p className="text-gray-400">{formatTime(start)}–{formatTime(end)} · {booking?.dance_style}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
