import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";
import InfoBox from "@/components/InfoBox";
import { UserCircle } from "lucide-react";

export default async function DancerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "dancer") redirect("/dashboard");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, availability_slots(start_at, end_at, trainer_id)")
    .eq("booker_id", user.id)
    .eq("status", "confirmed");

  const now = new Date();
  const upcomingBookings = (bookings ?? [])
    .filter(b => b.availability_slots && new Date(b.availability_slots.end_at) >= now)
    .sort((a, b) => new Date(a.availability_slots.start_at).getTime() - new Date(b.availability_slots.start_at).getTime());

  const completedBookings = (bookings ?? [])
    .filter(b => b.availability_slots && new Date(b.availability_slots.end_at) < now)
    .sort((a, b) => new Date(b.availability_slots.start_at).getTime() - new Date(a.availability_slots.start_at).getTime());

  return (
    <main className="bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Hei, {profile.name}!</h1>
          <div className="flex items-center gap-3">
            <Link href="/dancer/profil" className="hover:opacity-80 transition-opacity">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profil" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <UserCircle size={28} className="text-gray-400" />
              )}
            </Link>
            <LogoutButton />
          </div>
        </div>
        <p className="text-gray-500 mb-6">Evolution Danseklubb</p>
        <InfoBox />

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Mine privattimer</h2>
          <Link href="/book">
            <Button className="bg-purple-600 hover:bg-purple-700 text-sm">+ Book time</Button>
          </Link>
        </div>

        {upcomingBookings.length === 0 && completedBookings.length === 0 ? (
          <div className="bg-white rounded-xl border p-6 text-center text-gray-400">
            <p className="text-lg font-medium mb-2">Ingen bookede timer</p>
            <p className="text-sm mb-6">Finn en trener og book din første privattime</p>
          </div>
        ) : (() => {
          function getWeekNumber(date: Date) {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
          }

          const grouped: Record<string, typeof upcomingBookings> = {};
          for (const booking of upcomingBookings) {
            const key = new Date(booking.availability_slots.start_at).toLocaleDateString("sv-SE");
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(booking);
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
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Uke {week}</p>
                  <div className="space-y-4">
                    {dateKeys.sort().map((dateKey) => {
                      const dayBookings = grouped[dateKey];
                      const dayLabel = new Date(dateKey).toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" });
                      return (
                        <div key={dateKey}>
                          <p className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">
                            {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
                          </p>
                          <div className="space-y-2">
                            {dayBookings.map((booking) => {
                              const start = new Date(booking.availability_slots.start_at);
                              const end = new Date(booking.availability_slots.end_at);
                              const hoursUntil = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
                              return (
                                <div key={booking.id} className="bg-white rounded-xl border border-l-4 border-l-purple-400 p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        {start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}–{end.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                                      </p>
                                      <p className="text-sm text-purple-600 mt-1">{booking.dance_style}</p>
                                    </div>
                                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Bekreftet</span>
                                  </div>
                                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                                    {hoursUntil < 24 && (
                                      <p className="text-xs text-red-400">Under 24t – gebyr ved avbestilling</p>
                                    )}
                                    <Link href={`/booking/avbestill/${booking.id}`} className="ml-auto">
                                      <button className="text-xs text-red-400 hover:text-red-600">Avbestill</button>
                                    </Link>
                                  </div>
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

              {completedBookings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Gjennomførte timer</p>
                  <div className="space-y-2">
                    {completedBookings.map((booking) => {
                      const start = new Date(booking.availability_slots.start_at);
                      const end = new Date(booking.availability_slots.end_at);
                      const dayLabel = start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" });
                      return (
                        <div key={booking.id} className="bg-white rounded-xl border p-4 opacity-60">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-semibold text-gray-500">
                                {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
                              </p>
                              <p className="text-sm text-gray-400">
                                {start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}–{end.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <p className="text-sm text-gray-400 mt-1">{booking.dance_style}</p>
                            </div>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Fullført</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </main>
  );
}
