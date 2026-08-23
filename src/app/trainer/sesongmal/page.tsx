import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SesongmalSearch from "./SesongmalSearch";

export const dynamic = "force-dynamic";

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
    .not("season_goals", "is", null)
    .neq("season_goals", "")
    .order("name");

  const profiles = dancerProfiles ?? [];

  return (
    <main className="bg-gray-50 dark:bg-gray-950 min-h-screen p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-1">Sesongmål</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Mål dansere og foreldre har delt med deg</p>

        {profiles.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5 text-center text-gray-400 dark:text-gray-500">
            <p className="font-medium">Ingen har delt sesongmål ennå</p>
          </div>
        ) : (
          <SesongmalSearch profiles={profiles} />
        )}
      </div>
    </main>
  );
}
