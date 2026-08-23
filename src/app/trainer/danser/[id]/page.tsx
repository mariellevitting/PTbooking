import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { formatDate, formatTime } from "@/lib/dateUtils";

function isDone(goal: string) { return goal.startsWith("[x] "); }
function goalText(goal: string) { return isDone(goal) ? goal.slice(4) : goal; }

export default async function TrainerDancerProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!trainerProfile || trainerProfile.role !== "trainer") redirect("/dashboard");

  const { data: dancer } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, season_goals, goals_visible_to_trainer")
    .eq("id", params.id)
    .in("role", ["dancer", "parent"])
    .single();

  if (!dancer) redirect("/trainer/historikk");

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("id, start_at, end_at, bookings(id, dancer_name, dance_style, status)")
    .eq("trainer_id", user.id)
    .lt("end_at", new Date().toISOString())
    .order("start_at", { ascending: false })
    .limit(100);

  const dancerSlots = (slots ?? []).filter(s =>
    s.bookings?.some((b: any) => b.status === "confirmed" && b.dancer_name?.toLowerCase().includes(dancer.name.toLowerCase()))
  );

  const goals = dancer.season_goals
    ? dancer.season_goals.split("\n").filter((g: string) => g.trim() !== "")
    : [];

  return (
    <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 page-safe-top">
      <div className="max-w-lg mx-auto">
        <Link href="/trainer/historikk" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200 mb-2 -ml-2">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </Link>

        {/* Profil */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center overflow-hidden flex-shrink-0">
            {dancer.avatar_url
              ? <img src={dancer.avatar_url} alt={dancer.name} className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-[#E2A9F1]">{dancer.name.charAt(0)}</span>}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{dancer.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{dancerSlots.length} gjennomførte timer med deg</p>
          </div>
        </div>

        {/* Sesongmål */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Sesongmål</h2>
          {dancer.goals_visible_to_trainer === false ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Danseren har valgt å ikke dele sesongmål med trenere</p>
          ) : goals.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Ingen mål satt ennå</p>
          ) : (
            <ul className="space-y-2">
              {goals.map((goal: string, i: number) => {
                const done = isDone(goal);
                return (
                  <li key={i} className="flex items-start gap-2 text-sm py-1.5">
                    <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${done ? "bg-[#c87de0] border-[#c87de0]" : "border-gray-300 dark:border-gray-600"}`}>
                      {done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </span>
                    <span className={done ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}>
                      {goalText(goal)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Timer */}
        {dancerSlots.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Gjennomførte timer</h2>
            <div className="space-y-2">
              {dancerSlots.map(slot => {
                const booking = (slot.bookings as any[])?.find(b => b.status === "confirmed");
                const start = new Date(slot.start_at);
                const end = new Date(slot.end_at);
                return (
                  <div key={slot.id} className="flex justify-between items-center text-sm border-t dark:border-gray-700 pt-2">
                    <div>
                      <p className="text-gray-700 dark:text-gray-300 capitalize">{formatDate(start, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                      <p className="text-gray-400 dark:text-gray-500">{formatTime(start)}–{formatTime(end)} · {booking?.dance_style}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
