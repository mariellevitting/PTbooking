import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NMCountdown from "@/components/NMCountdown";
import TrainerDashboardTabs from "./TrainerDashboardTabs";

export const dynamic = "force-dynamic";

export default async function TrainerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("*, bookings(id, dancer_name, dance_style, booker_id, status, profiles!bookings_booker_id_fkey(avatar_url))")
    .eq("trainer_id", user.id)
    .gte("start_at", new Date().toISOString())
    .order("start_at");

  const { data: completedSlots } = await supabase
    .from("availability_slots")
    .select("*, bookings(id, dancer_name, dance_style, status)")
    .eq("trainer_id", user.id)
    .lt("end_at", new Date().toISOString())
    .order("start_at", { ascending: false });

  return (
    <main className="bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-1">Heihei, {profile.name.split(" ")[0]}! 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Evolution Studio – Trener</p>
        <NMCountdown href="/trainer/konkurranser" />
        <TrainerDashboardTabs
          slots={(slots ?? []) as any}
          completedSlots={(completedSlots ?? []) as any}
        />
      </div>
    </main>
  );
}
