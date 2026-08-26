import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SesongmalSearch from "./SesongmalSearch";

export const dynamic = "force-dynamic";

export default async function TrainerSesongmalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, club_id").eq("id", user.id).single();
  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  const clubId = profile.club_id ?? "";

  // Hent foreldre fra samme klubb
  const { data: clubParents } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .eq("role", "parent")
    .eq("club_id", clubId);

  const clubParentIds = (clubParents ?? []).map(p => p.id);
  const parentMap: Record<string, { name: string; avatar_url: string | null }> = {};
  for (const p of clubParents ?? []) parentMap[p.id] = { name: p.name, avatar_url: p.avatar_url };

  const [{ data: dancerProfiles }, { data: childrenWithGoals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, avatar_url, season_goals, role")
      .in("role", ["dancer", "parent"])
      .eq("club_id", clubId)
      .eq("goals_visible_to_trainer", true)
      .not("season_goals", "is", null)
      .neq("season_goals", "")
      .order("name"),
    clubParentIds.length > 0
      ? supabase
          .from("children")
          .select("id, name, season_goals, parent_id")
          .in("parent_id", clubParentIds)
          .not("season_goals", "is", null)
          .neq("season_goals", "")
          .order("name")
      : Promise.resolve({ data: [] }),
  ]);

  const profiles = dancerProfiles ?? [];

  const children = (childrenWithGoals ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    avatar_url: parentMap[c.parent_id]?.avatar_url ?? null,
    season_goals: c.season_goals,
    role: "child" as const,
    parentName: parentMap[c.parent_id]?.name ?? null,
  }));

  return (
    <main className="bg-gray-50 dark:bg-gray-950 min-h-screen p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-1">Sesongmål</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Mål dansere og foreldre har delt med deg</p>

        {profiles.length === 0 && children.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-5 text-center text-gray-400 dark:text-gray-500">
            <p className="font-medium">Ingen har delt sesongmål ennå</p>
          </div>
        ) : (
          <SesongmalSearch profiles={profiles} children={children} />
        )}
      </div>
    </main>
  );
}
