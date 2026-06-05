import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";

export default async function ParentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") redirect("/dashboard");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, availability_slots(start_at, end_at, trainer_id)")
    .eq("booker_id", user.id)
    .eq("status", "confirmed");

  const upcomingBookings = (bookings ?? [])
    .filter(b => b.availability_slots && new Date(b.availability_slots.start_at) >= new Date())
    .sort((a, b) => new Date(a.availability_slots.start_at).getTime() - new Date(b.availability_slots.start_at).getTime());

  return (
    <main className="bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Hei, {profile.name}!</h1>
          <LogoutButton />
        </div>
        <p className="text-gray-500 mb-8">Evolution Danseklubb</p>

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Mine timer</h2>
          <Link href="/book">
            <Button className="bg-purple-600 hover:bg-purple-700 text-sm">
              + Book time
            </Button>
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-xl border p-6 text-center text-gray-400">
            <p className="text-lg font-medium mb-2">Ingen bookede timer</p>
            <p className="text-sm mb-6">Book privattime for ditt barn</p>
            <Link href="/book">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Book privattime
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => {
              const start = new Date(booking.availability_slots.start_at);
              const end = new Date(booking.availability_slots.end_at);
              const hoursUntil = (start.getTime() - new Date().getTime()) / (1000 * 60 * 60);
              return (
                <div key={booking.id} className="bg-white rounded-xl border p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold capitalize">
                        {start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}–{end.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-sm text-purple-600 mt-1">{booking.dancer_name} · {booking.dance_style}</p>
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
        )}
      </div>
    </main>
  );
}
