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
    .select("role")
    .eq("id", user.id)
    .single();

  const backHref = profile?.role === "parent" ? "/parent/dashboard" : "/dancer/dashboard";

  const [{ data: trainers }, { data: pins }] = await Promise.all([
    supabase.from("profiles").select("id, name, trainers(dance_styles, price)").eq("role", "trainer").order("name"),
    supabase.from("pinned_trainers").select("trainer_id").eq("user_id", user.id),
  ]);

  const pinnedIds = new Set((pins ?? []).map(p => p.trainer_id));

  const trainerList = (trainers ?? []).map(trainer => {
    const trainerData = trainer.trainers as any;
    const styles: string[] = Array.isArray(trainerData)
      ? trainerData[0]?.dance_styles ?? []
      : trainerData?.dance_styles ?? [];
    const price: number = Array.isArray(trainerData) ? trainerData[0]?.price ?? 150 : trainerData?.price ?? 150;
    return { id: trainer.id, name: trainer.name, styles, isPinned: pinnedIds.has(trainer.id), price };
  });

  return (
    <main className="bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline mb-6">
          <ArrowLeft size={16} /> Tilbake
        </Link>
        <h1 className="text-2xl font-bold mb-6">Velg trener</h1>

        {trainerList.length === 0 ? (
          <div className="bg-white rounded-xl border p-6 text-center text-gray-400">
            <p>Ingen trenere tilgjengelig ennå</p>
          </div>
        ) : (
          <TrainerList trainers={trainerList} />
        )}
      </div>
    </main>
  );
}
