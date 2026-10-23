import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SesongmalSearch from "./SesongmalSearch";
import { hasAnyGoals } from "@/components/GoalsReadOnly";

export const dynamic = "force-dynamic";

export default async function TrainerSesongmalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, club_id").eq("id", user.id).single();
  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  const clubId = profile.club_id ?? "";

  const POINT_COLS = "points_freestyle, points_slow, level_freestyle, level_slow";

  // Hent foreldre fra samme klubb
  const { data: clubParents } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .eq("role", "parent")
    .eq("club_id", clubId);

  const clubParentIds = (clubParents ?? []).map(p => p.id);
  const parentMap: Record<string, { name: string; avatar_url: string | null }> = {};
  for (const p of clubParents ?? []) parentMap[p.id] = { name: p.name, avatar_url: p.avatar_url };

  const [{ data: dancerProfiles }, { data: allChildren }] = await Promise.all([
    supabase
      .from("profiles")
      .select(`id, name, avatar_url, season_goals, goals_freestyle, goals_slow, goals_visible_to_trainer, role, ${POINT_COLS}`)
      .in("role", ["dancer", "parent"])
      .eq("club_id", clubId)
      .order("name"),
    clubParentIds.length > 0
      ? supabase
          .from("children")
          .select(`id, name, season_goals, goals_freestyle, goals_slow, parent_id, ${POINT_COLS}`)
          .in("parent_id", clubParentIds)
          .order("name")
      : Promise.resolve({ data: [] }),
  ]);

  // Resultater: RLS gir bare treff for dansere i egen klubb som deler resultatene sine
  const ownerIds = (dancerProfiles ?? []).map((p: any) => p.id);
  const { data: allResults } = ownerIds.length > 0
    ? await supabase
        .from("competition_results")
        .select("user_id, child_id, competition_name, placement_freestyle, placement_slow, created_at")
        .in("user_id", ownerIds)
        .order("created_at", { ascending: false })
    : { data: [] as any[] };
  const resultsFor = (userId: string | null, childId: string | null) =>
    (allResults ?? []).filter((r: any) => childId ? r.child_id === childId : r.user_id === userId && !r.child_id);

  const profiles = (dancerProfiles ?? [])
    .map((p: any) => ({
      id: p.id,
      name: p.name,
      avatar_url: p.avatar_url,
      season_goals: p.goals_visible_to_trainer === false ? null : p.season_goals,
      goals_freestyle: p.goals_visible_to_trainer === false ? null : p.goals_freestyle,
      goals_slow: p.goals_visible_to_trainer === false ? null : p.goals_slow,
      role: p.role as string,
      points_freestyle: p.points_freestyle ?? 0,
      points_slow: p.points_slow ?? 0,
      level_freestyle: p.level_freestyle ?? 0,
      level_slow: p.level_slow ?? 0,
      results: resultsFor(p.id, null),
    }))
    .filter((p) => p.results.length > 0 || hasAnyGoals({ season: p.season_goals, freestyle: p.goals_freestyle, slow: p.goals_slow }));

  const children = (allChildren ?? [])
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      avatar_url: parentMap[c.parent_id]?.avatar_url ?? null,
      season_goals: c.season_goals,
      goals_freestyle: c.goals_freestyle,
      goals_slow: c.goals_slow,
      role: "child" as const,
      parentName: parentMap[c.parent_id]?.name ?? null,
      points_freestyle: c.points_freestyle ?? 0,
      points_slow: c.points_slow ?? 0,
      level_freestyle: c.level_freestyle ?? 0,
      level_slow: c.level_slow ?? 0,
      results: resultsFor(null, c.id),
    }))
    .filter((c) => c.results.length > 0 || hasAnyGoals({ season: c.season_goals, freestyle: c.goals_freestyle, slow: c.goals_slow }));

  return (
    <main className="bg-gray-50 dark:bg-gray-950 min-h-screen p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-1">Sesongmål</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Søk opp en danser for å se mål, poeng og resultater</p>

        {profiles.length === 0 && children.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5 text-center text-gray-400 dark:text-gray-500">
            <p className="font-medium">Ingen har delt mål eller resultater ennå</p>
          </div>
        ) : (
          <SesongmalSearch profiles={profiles} children={children} />
        )}
      </div>
    </main>
  );
}
