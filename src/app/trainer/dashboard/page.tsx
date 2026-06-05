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

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("trainer_id", user.id)
    .gte("start_at", new Date().toISOString())
    .order("start_at");

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Hei, {profile.name}!</h1>
        </div>
        <p className="text-gray-500 mb-8">Evolution Dance Studio – Trener</p>

        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Dine ledige tider</h2>
          <Link href="/trainer/availability">
            <Button className="bg-purple-600 hover:bg-purple-700 text-sm">
              + Legg ut tid
            </Button>
          </Link>
        </div>

        {!slots || slots.length === 0 ? (
          <div className="bg-white rounded-xl border p-6 text-center text-gray-400">
            <p className="text-lg font-medium mb-2">Ingen ledige tider lagt ut</p>
            <p className="text-sm">Legg ut tider så dansere kan booke deg</p>
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => {
              const start = new Date(slot.start_at);
              const end = new Date(slot.end_at);
              const dateStr = start.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" });
              const timeStr = `${start.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}`;
              return (
                <div key={slot.id} className="bg-white rounded-xl border p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium capitalize">{dateStr}</p>
                    <p className="text-sm text-gray-500">{timeStr}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${slot.is_booked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                    {slot.is_booked ? "Booket" : "Ledig"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
