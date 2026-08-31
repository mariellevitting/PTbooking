import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import ParentDashboardNav from "./ParentDashboardNav";
import { getClubById } from "@/lib/club";

export const dynamic = "force-dynamic";

export default async function ParentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") redirect("/dashboard");

  const club = await getClubById(supabase, profile.club_id);

  const [
    { data: notifications },
    { data: children },
    { data: trainers },
  ] = await Promise.all([
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("children").select("id, name, season_goals, points_freestyle, points_slow, level_freestyle, level_slow").eq("parent_id", user.id).order("created_at"),
    supabase.from("profiles").select("id, name, avatar_url, trainers(dance_styles)").eq("role", "trainer").eq("club_id", profile?.club_id ?? "").order("name"),
  ]);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, availability_slots(start_at, end_at, trainer_id, profiles(name))")
    .or(`booker_id.eq.${user.id},linked_user_id.eq.${user.id}`)
    .eq("status", "confirmed");

  const now = new Date();
  const upcomingBookings = (bookings ?? [])
    .filter(b => b.availability_slots && new Date(b.availability_slots.end_at) >= now)
    .sort((a, b) => new Date(a.availability_slots.start_at).getTime() - new Date(b.availability_slots.start_at).getTime());

  const completedBookings = (bookings ?? [])
    .filter(b => b.availability_slots && new Date(b.availability_slots.end_at) < now)
    .sort((a, b) => new Date(b.availability_slots.start_at).getTime() - new Date(a.availability_slots.start_at).getTime());

  return (
    <main className="bg-gray-50 dark:bg-gray-950 min-h-screen pt-14 md:pt-0">
      <OnboardingOverlay />
      <div>
        <ParentDashboardNav
          parentId={user.id}
          userName={profile.name}
          avatarUrl={profile.avatar_url ?? null}
          notifications={notifications ?? []}
          upcomingBookings={upcomingBookings}
          completedBookings={completedBookings}
          children={children ?? []}
          trainers={(trainers ?? []).map(t => ({ name: t.name, avatarUrl: t.avatar_url ?? null, styles: (Array.isArray(t.trainers) ? t.trainers[0]?.dance_styles : (t.trainers as any)?.dance_styles) ?? [] }))}
          club={club}
        />
      </div>
    </main>
  );
}
