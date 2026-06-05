import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, ChevronRight } from "lucide-react";

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

  const { data: trainers } = await supabase
    .from("profiles")
    .select("id, name, trainers(dance_styles)")
    .eq("role", "trainer")
    .order("name");

  return (
    <main className="bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline mb-6">
          <ArrowLeft size={16} /> Tilbake
        </Link>
        <h1 className="text-2xl font-bold mb-6">Velg trener</h1>

        {!trainers || trainers.length === 0 ? (
          <div className="bg-white rounded-xl border p-6 text-center text-gray-400">
            <p>Ingen trenere tilgjengelig ennå</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trainers.map((trainer) => {
              const trainerData = trainer.trainers as any;
              const styles: string[] = Array.isArray(trainerData)
                ? trainerData[0]?.dance_styles ?? []
                : trainerData?.dance_styles ?? [];
              return (
                <Link key={trainer.id} href={`/book/${trainer.id}`}>
                  <div className="bg-white rounded-xl border p-4 hover:border-purple-400 hover:shadow-sm transition-all cursor-pointer flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg shrink-0">
                      {trainer.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{trainer.name}</p>
                      {styles.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{styles.join(" · ")}</p>
                      )}
                    </div>
                    <ChevronRight size={18} className="text-gray-300 shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
