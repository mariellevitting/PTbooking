import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";

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
    .select("*, bookings(dancer_name, dance_style)")
    .eq("trainer_id", user.id)
    .gte("start_at", new Date().toISOString())
    .order("start_at");

  const unreadCount = notifications?.length ?? 0;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Hei, {profile.name}!</h1>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <div className="relative">
                <span className="text-2xl">🔔</span>
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              </div>
            )}
            <LogoutButton />
          </div>
        </div>
        <p className="text-gray-500 mb-6">Evolution Dance Studio – Trener</p>

        {/* Varsler */}
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

        {/* Timer */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Mine tider</h2>
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
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => {
              const start = new Date(slot.start_at);
              const end = new Date(slot.end_at);
              const booking = slot.bookings?.[0];
              return (
                <div key={slot.id} className={`bg-white rounded-xl border p-4 flex justify-between items-center ${booking ? "border-l-4 border-l-purple-400" : ""}`}>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}–{end.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {booking && (
                      <p className="text-sm font-medium text-purple-700 mt-1">
                        {booking.dancer_name} · {booking.dance_style}
                      </p>
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
        )}
      </div>
    </main>
  );
}
