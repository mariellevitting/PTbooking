import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import { UserCircle } from "lucide-react";
import NMCountdown from "@/components/NMCountdown";
import TrainerDashboardTabs from "./TrainerDashboardTabs";

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

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Alle fremtidige slots med evt. booking
  const { data: slots } = await supabase
    .from("availability_slots")
    .select("*, bookings(id, dancer_name, dance_style, booker_id, status, profiles(avatar_url))")
    .eq("trainer_id", user.id)
    .gte("start_at", new Date().toISOString())
    .order("start_at");

  // Gjennomførte slots
  const { data: completedSlots } = await supabase
    .from("availability_slots")
    .select("*, bookings(id, dancer_name, dance_style, status)")
    .eq("trainer_id", user.id)
    .lt("end_at", new Date().toISOString())
    .order("start_at", { ascending: false });

  return (
    <main className="bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Heihei, {profile.name.split(" ")[0]}! 👋</h1>
          <div className="flex items-center gap-3">
            <NotificationBell notifications={notifications ?? []} />
            <Link href="/trainer/profil" className="hover:opacity-80 transition-opacity">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profil" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <UserCircle size={28} className="text-gray-400" />
              )}
            </Link>
            <LogoutButton />
          </div>
        </div>
        <p className="text-gray-800 mb-6"><a href="https://evolution-studio.no" target="_blank" rel="noopener noreferrer" className="hover:underline">Evolution Studio – Trener</a></p>
        <NMCountdown />

        <TrainerDashboardTabs
          slots={(slots ?? []) as any}
          completedSlots={(completedSlots ?? []) as any}
        />
      </div>
    </main>
  );
}
