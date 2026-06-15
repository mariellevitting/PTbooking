import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import ParentDashboardNav from "./ParentDashboardNav";

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

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, availability_slots(start_at, end_at, trainer_id, profiles(name))")
    .eq("booker_id", user.id)
    .eq("status", "confirmed");

  const now = new Date();
  const upcomingBookings = (bookings ?? [])
    .filter(b => b.availability_slots && new Date(b.availability_slots.end_at) >= now)
    .sort((a, b) => new Date(a.availability_slots.start_at).getTime() - new Date(b.availability_slots.start_at).getTime());

  const completedBookings = (bookings ?? [])
    .filter(b => b.availability_slots && new Date(b.availability_slots.end_at) < now)
    .sort((a, b) => new Date(b.availability_slots.start_at).getTime() - new Date(a.availability_slots.start_at).getTime());

  return (
    <main className="bg-gray-50 min-h-screen">
      <OnboardingOverlay />
      <div className="max-w-4xl mx-auto md:px-6 md:pb-6">
        <ParentDashboardNav
          userName={profile.name}
          avatarUrl={profile.avatar_url ?? null}
          notifications={notifications ?? []}
          upcomingBookings={upcomingBookings}
          completedBookings={completedBookings}
        />
      </div>
    </main>
  );
}
