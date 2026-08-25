import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import TrainerList from "./TrainerList";

export default async function BookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  const backHref = profile?.role === "parent" ? "/parent/dashboard" : "/dancer/dashboard";

  const now = new Date().toISOString();
  const [{ data: trainers }, { data: pins }, { data: slots }] = await Promise.all([
    supabase.from("profiles").select("id, name, avatar_url, trainers(dance_styles, price)").eq("role", "trainer").eq("club_id", profile?.club_id ?? "").order("name"),
    supabase.from("pinned_trainers").select("trainer_id").eq("user_id", user.id),
    supabase.from("availability_slots").select("trainer_id").eq("is_booked", false).gte("start_at", now),
  ]);

  const pinnedIds = new Set((pins ?? []).map(p => p.trainer_id));
  const slotCounts: Record<string, number> = {};
  for (const s of slots ?? []) {
    slotCounts[s.trainer_id] = (slotCounts[s.trainer_id] ?? 0) + 1;
  }

  const trainerList = (trainers ?? []).map(trainer => {
    const trainerData = trainer.trainers as any;
    const styles: string[] = Array.isArray(trainerData)
      ? trainerData[0]?.dance_styles ?? []
      : trainerData?.dance_styles ?? [];
    const price: number = Array.isArray(trainerData) ? trainerData[0]?.price ?? 150 : trainerData?.price ?? 150;
    return { id: trainer.id, name: trainer.name, avatarUrl: trainer.avatar_url ?? null, styles, isPinned: pinnedIds.has(trainer.id), price, availableSlots: slotCounts[trainer.id] ?? 0 };
  });

  return (
    <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 page-safe-top">
      <div className="max-w-lg mx-auto">
        <Link href={backHref} className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200 mb-2 -ml-2">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </Link>
        <h1 className="text-2xl font-bold mb-6">Velg trener</h1>

        {trainerList.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500">
            <p>Ingen trenere tilgjengelig ennå</p>
          </div>
        ) : (
          <TrainerList trainers={trainerList} />
        )}
      </div>
    </main>
  );
}
