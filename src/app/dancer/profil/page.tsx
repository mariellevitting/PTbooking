import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DancerProfileClient from "./DancerProfileClient";

export default async function DancerProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: competitionResults }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("competition_results").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  if (!profile || profile.role !== "dancer") redirect("/dashboard");

  return (
    <main className="bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <Link href="/dancer/dashboard" className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline mb-6">
          <ArrowLeft size={16} /> Tilbake
        </Link>
        <h1 className="text-2xl font-bold mb-6">Min profil</h1>
        <DancerProfileClient
          userId={user.id}
          name={profile.name}
          phone={profile.phone ?? ""}
          avatarUrl={profile.avatar_url ?? null}
          seasonGoals={profile.season_goals ?? ""}
          pointsFreestyle={profile.points_freestyle ?? 0}
          pointsSlow={profile.points_slow ?? 0}
          levelFreestyle={profile.level_freestyle ?? 0}
          levelSlow={profile.level_slow ?? 0}
          competitionResults={competitionResults ?? []}
        />
      </div>
    </main>
  );
}
