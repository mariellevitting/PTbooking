import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfilForm from "./ProfilForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
      </div>
    </main>
  );
}
