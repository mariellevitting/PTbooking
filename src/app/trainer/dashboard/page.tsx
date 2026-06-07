import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import { UserCircle } from "lucide-react";

export default async function TrainerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("read", false)
    .order("created_at", { ascending: false });

  // Alle fremtidige slots med evt. booking
  const { data: slots } = await supabase
    .from("availability_slots")
    .select("*, bookings!left(id, dancer_name, dance_style, booker_id, status, profiles(avatar_url))")
    .eq("trainer_id", user.id)
    .gte("start_at", new Date().toISOString())
    .order("start_at");

  return (
    <main className="bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Hei, {profile.name}!</h1>
          <div className="flex items-center gap-3">
            <NotificationBell notifications={notifications ?? []} />
            <Link href="/trainer/profil" className="hover:opacity-80 transition-opacity">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profil" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <UserCircle size={28} className="text-gray-400" />
              )}
            </Link>
            <LogoutButton />
          </div>
        </div>
        <p className="text-gray-500 mb-6">Evolution Danseklubb – Trener</p>

        {/* Timer */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Mine privattimer</h2>
          <Link href="/trainer/availability">
            <Button className="bg-purple-600 hover:bg-purple-700 text-sm">
              + Legg ut tid
            </Button>
          </Link>
        </div>

        {!slots || slots.length === 0 ? (
          <div className="bg-white rounded-xl border p-5 text-center text-gray-400">
            <p className="font-medium">Ingen tider lagt ut</p>
            <p className="text-sm mt-1">Legg ut ledige tider så dansere kan booke deg</p>
          </div>
        ) : (() => {
          // Grupper slots per dag (YYYY-MM-DD)
          const grouped: Record<string, typeof slots> = {};
          for (const slot of slots) {
            const key = new Date(slot.start_at).toLocaleDateString("sv-SE"); // "2026-06-08"
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(slot);
          }

          // Grupper dagene per uke
          function getWeekNumber(date: Date) {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
          }

          const weekGroups: Record<number, string[]> = {};
          for (const dateKey of Object.keys(grouped).sort()) {
            const week = getWeekNumber(new Date(dateKey));
            if (!weekGroups[week]) weekGroups[week] = [];
            weekGroups[week].push(dateKey);
          }

          return (
            <div className="space-y-6">
              {Object.entries(weekGroups).map(([week, dateKeys]) => (
                <div key={week}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Uke {week}
                  </p>
                  <div className="space-y-4">
                    {dateKeys.sort().map((dateKey) => {
                      const daySlots = grouped[dateKey];
                      const dayDate = new Date(dateKey);
                      const dayLabel = dayDate.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" });
                      return (
                        <div key={dateKey}>
                          <p className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">
                            {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
                          </p>
                          <div className="space-y-2">
                            {daySlots.map((slot) => {
                              const start = new Date(slot.start_at);
                              const end = new Date(slot.end_at);
                              const booking = slot.bookings?.find((b: any) => b.status === "confirmed");
                              return (
                                <div key={slot.id} className={`rounded-xl border p-4 flex justify-between items-center ${booking ? "bg-white border-l-4 border-l-purple-400" : "bg-gray-50 border-dashed border-gray-200"}`}>
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      {start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}–{end.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                    {booking && (
                                      <>
                                        <div className="flex items-center gap-2 mt-1">
                                          {(booking.profiles as any)?.avatar_url ? (
                                            <img src={(booking.profiles as any).avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                                          ) : (
                                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">
                                              {booking.dancer_name.charAt(0)}
                                            </div>
                                          )}
                                          <p className="text-sm font-medium text-purple-700">
                                            {booking.dancer_name} · {booking.dance_style}
                                          </p>
                                        </div>
                                        <Link href={`/trainer/avbestill/${booking.id}`} className="text-xs text-red-400 hover:text-red-600 mt-1 inline-block">
                                          Avbestill
                                        </Link>
                                      </>
                                    )}
                                  </div>
                                  {booking ? (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full whitespace-nowrap">Opptatt</span>
                                  ) : (
                                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Ledig</span>
                                  )}
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
          );
        })()}
      </div>
    </main>
  );
}
