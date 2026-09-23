import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { greeting } from "@/lib/greeting";
import NMCountdown from "@/components/NMCountdown";
import TrainerDashboardTabs from "./TrainerDashboardTabs";
import TrainerWebDashboard from "./TrainerWebDashboard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function TrainerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name, club_id, clubs(name)")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  const now = new Date().toISOString();

  const [{ data: slots }, { data: completedSlots }] = await Promise.all([
    supabase
      .from("availability_slots")
      .select("*, bookings(id, dancer_name, dance_style, booker_id, linked_user_id, status, paid, receipt_reminders_sent, booker:profiles!bookings_booker_id_fkey(avatar_url), linked_profile:profiles!bookings_linked_user_id_fkey(avatar_url))")
      .eq("trainer_id", user.id)
      .gte("start_at", now)
      .order("start_at"),
    supabase
      .from("availability_slots")
      .select("*, bookings(id, dancer_name, dance_style, status, paid, receipt_reminders_sent, booker_id, linked_user_id)")
      .eq("trainer_id", user.id)
      .lt("end_at", now)
      .order("start_at", { ascending: false }),
  ]);

  const freeCount = (slots ?? []).filter(s => !s.bookings?.some((b: any) => b.status === "confirmed")).length;

  return (
    <main className="bg-gray-50 dark:bg-gray-950 min-h-screen page-safe-top">
      {/* Mobil */}
      <div className="lg:hidden p-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">{greeting()}, {profile.name.split(" ")[0]}! 👋</h1>
        <NMCountdown href="/trainer/konkurranser" clubId={(profile as any).club_id ?? null} />
        <TrainerDashboardTabs
          slots={(slots ?? []) as any}
          completedSlots={(completedSlots ?? []) as any}
          dancerProfiles={[]}
          trainerName={profile.name}
          trainerId={user.id}
        />
      </div>

      {/* Web */}
      <div className="hidden lg:block max-w-5xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{greeting()}, {profile.name.split(" ")[0]}! 👋</h1>
          <Link href="/trainer/availability">
            <Button className="bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white">
              + Legg ut tid
            </Button>
          </Link>
        </div>
        <NMCountdown href="/trainer/konkurranser" clubId={(profile as any).club_id ?? null} />
        <TrainerWebDashboard
          slots={(slots ?? []) as any}
          completedSlots={(completedSlots ?? []) as any}
          trainerName={profile.name}
          trainerId={user.id}
          freeCount={freeCount}
        />
      </div>
    </main>
  );
}
