import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import InfoBox from "@/components/InfoBox";
import NotificationBell from "@/components/NotificationBell";
import { UserCircle } from "lucide-react";
import NMCountdown from "@/components/NMCountdown";
import DancerDashboardNav from "./DancerDashboardNav";

export default async function DancerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "dancer") redirect("/dashboard");

  const [
    { data: notifications },
    { data: bookings },
    { data: competitionResults },
  ] = await Promise.all([
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("bookings").select("*, availability_slots(start_at, end_at, trainer_id, profiles(name))").eq("booker_id", user.id).eq("status", "confirmed"),
    supabase.from("competition_results").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const now = new Date();
  const upcomingBookings = (bookings ?? [])
    .filter(b => b.availability_slots && new Date(b.availability_slots.end_at) >= now)
    .sort((a, b) => new Date(a.availability_slots.start_at).getTime() - new Date(b.availability_slots.start_at).getTime());

  const completedBookings = (bookings ?? [])
    .filter(b => b.availability_slots && new Date(b.availability_slots.end_at) < now)
    .sort((a, b) => new Date(b.availability_slots.start_at).getTime() - new Date(a.availability_slots.start_at).getTime());

  return (
    <main className="bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Heihei, {profile.name.split(" ")[0]}! 👋</h1>
          <div className="flex items-center gap-3">
            <NotificationBell notifications={notifications ?? []} />
            <Link href="/dancer/profil" className="hover:opacity-80 transition-opacity">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profil" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <UserCircle size={28} className="text-gray-400" />
              )}
            </Link>
            <LogoutButton />
          </div>
        </div>
        <p className="text-gray-500 mb-6">
          <a href="https://evolution-studio.no" target="_blank" rel="noopener noreferrer" className="hover:underline">Evolution Danseklubb</a>
        </p>
        <InfoBox />

        <DancerDashboardNav
          userId={user.id}
          upcomingBookings={upcomingBookings}
          completedBookings={completedBookings}
          seasonGoals={profile.season_goals ?? ""}
          pointsFreestyle={profile.points_freestyle ?? 0}
          pointsSlow={profile.points_slow ?? 0}
          levelFreestyle={profile.level_freestyle ?? 0}
          levelSlow={profile.level_slow ?? 0}
          competitionResults={competitionResults ?? []}
          now={now.toISOString()}
        />
      </div>
    </main>
  );
}
