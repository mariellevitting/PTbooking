import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

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

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, availability_slots!inner(start_at, end_at, trainer_id)")
    .eq("availability_slots.trainer_id", user.id)
    .eq("status", "confirmed")
    .gte("availability_slots.start_at", new Date().toISOString())
    .order("availability_slots.start_at");

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("trainer_id", user.id)
    .eq("is_booked", false)
    .gte("start_at", new Date().toISOString())
    .order("start_at")
    .limit(5);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Hei, {profile.name}!</h1>
        </div>
        <p className="text-gray-500 mb-6">Evolution Dance Studio – Trener</p>

        {notifications && notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex gap-3 items-start">
                <span className="text-purple-500 text-lg">🔔</span>
                <div>
                  <p className="text-sm font-medium text-purple-800">{n.message}</p>
                  <p className="text-xs text-purple-400 mt-0.5">
                    {new Date(n.created_at).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Kommende bookinger */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Kommende timer</h2>
        </div>

        {!bookings || bookings.length === 0 ? (
          <div className="bg-white rounded-xl border p-5 text-center text-gray-400 mb-6">
            <p className="font-medium">Ingen bookede timer</p>
            <p className="text-sm mt-1">Dansere kan booke deg når du legger ut ledige tider</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {bookings.map((booking) => {
              const start = new Date(booking.availability_slots.start_at);
              const end = new Date(booking.availability_slots.end_at);
              return (
                <div key={booking.id} className="bg-white rounded-xl border p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{booking.dancer_name}</p>
                      <p className="text-sm text-purple-600">{booking.dance_style}</p>
                      <p className="text-sm text-gray-500 mt-1 capitalize">
                        {start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}–{end.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Bekreftet</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ledige tider */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Ledige tider</h2>
          <Link href="/trainer/availability">
            <Button className="bg-purple-600 hover:bg-purple-700 text-sm">
              + Legg ut tid
            </Button>
          </Link>
        </div>

        {!slots || slots.length === 0 ? (
          <div className="bg-white rounded-xl border p-5 text-center text-gray-400">
            <p className="text-sm">Ingen ledige tider lagt ut</p>
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => {
              const start = new Date(slot.start_at);
              const end = new Date(slot.end_at);
              return (
                <div key={slot.id} className="bg-white rounded-xl border p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}–{end.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Ledig</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
