import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfilForm from "./ProfilForm";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

export default async function TrainerProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  const { data: trainerDetails } = await supabase
    .from("trainers")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: allTrainers } = await supabase
    .from("profiles")
    .select("id, name, phone, trainers(dance_styles)")
    .eq("role", "trainer")
    .order("name");

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <Link href="/trainer/dashboard" className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline mb-6">
          <ArrowLeft size={16} /> Tilbake
        </Link>
        <h1 className="text-2xl font-bold mb-6">Min profil</h1>
        <ProfilForm
          userId={user.id}
          name={profile.name}
          phone={profile.phone ?? ""}
          bio={trainerDetails?.bio ?? ""}
          danceStyles={trainerDetails?.dance_styles ?? []}
        />

        {/* Registrerte trenere */}
        <div className="bg-white rounded-2xl border p-5 mt-6">
          <h2 className="font-semibold text-base flex items-center gap-2 mb-4">
            <Users size={16} className="text-purple-500" />
            Registrerte trenere ({allTrainers?.length ?? 0})
          </h2>
          <div className="space-y-3">
            {allTrainers?.map((t) => {
              const styles: string[] = (Array.isArray(t.trainers) ? t.trainers[0] : t.trainers as any)?.dance_styles ?? [];
              return (
                <div key={t.id} className={`flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0 ${t.id === user.id ? "opacity-60" : ""}`}>
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0 text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{t.name} {t.id === user.id && <span className="text-gray-400 font-normal">(deg)</span>}</p>
                    {styles.length > 0 ? (
                      <p className="text-xs text-gray-400 mt-0.5">{styles.join(" · ")}</p>
                    ) : (
                      <p className="text-xs text-red-300 mt-0.5">Stiler ikke satt opp ennå</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
