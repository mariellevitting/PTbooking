import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

function isDone(goal: string) { return goal.startsWith("[x] "); }
function goalText(goal: string) { return isDone(goal) ? goal.slice(4) : goal; }

export default async function TrainerSesongmalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  const { data: dancerProfiles } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, season_goals, role")
    .in("role", ["dancer", "parent"])
    .eq("goals_visible_to_trainer", true)
    .order("name");

  const profiles = dancerProfiles ?? [];
  const withGoals = profiles.filter(p => p.season_goals?.trim());
  const withoutGoals = profiles.filter(p => !p.season_goals?.trim());

  return (
    <main className="bg-gray-50 dark:bg-gray-950 min-h-screen p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-1">Sesongmål</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Mål dansere og foreldre har delt med deg</p>

        <div className="space-y-3">
          {profiles.length === 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5 text-center text-gray-400 dark:text-gray-500">
              <p className="font-medium">Ingen har delt sesongmål ennå</p>
            </div>
          )}

          {withGoals.map(p => {
            const goals = p.season_goals!.split("\n").filter((g: string) => g.trim() !== "");
            return (
              <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4">
                <Link href={`/trainer/danser/${p.id}`} className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.avatar_url
                      ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                      : <span className="text-sm font-bold text-[#E2A9F1]">{p.name.charAt(0)}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{p.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{p.role === "parent" ? "Forelder" : "Danser"}</p>
                  </div>
                </Link>
                <ul className="space-y-1.5">
                  {goals.map((goal: string, i: number) => {
                    const done = isDone(goal);
                    return (
                      <li key={i} className="flex items-center justify-between gap-2 text-sm py-1">
                        <span className="text-gray-700 dark:text-gray-300">{goalText(goal)}</span>
                        {done && <span className="text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">Mål nådd</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {withoutGoals.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Ingen mål satt</p>
              <div className="space-y-2">
                {withoutGoals.map(p => (
                  <Link key={p.id} href={`/trainer/danser/${p.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="text-xs font-bold text-[#E2A9F1]">{p.name.charAt(0)}</span>}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{p.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
