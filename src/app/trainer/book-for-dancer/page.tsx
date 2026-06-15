import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BookForDancerForm from "./BookForDancerForm";

export default async function BookForDancerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  const { data: trainerDetails } = await supabase
    .from("trainers")
    .select("dance_styles")
    .eq("id", user.id)
    .single();

  const danceStyles: string[] = trainerDetails?.dance_styles ?? [];

  return (
    <main className="bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <Link href="/trainer/dashboard" className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline mb-6">
          <ArrowLeft size={16} /> Tilbake
        </Link>
        <h1 className="text-2xl font-bold mb-2">Book time for danser</h1>
        <p className="text-sm text-gray-500 mb-6">Brukes når en forelder eller danser avtaler time muntlig med deg.</p>
        <BookForDancerForm trainerId={user.id} danceStyles={danceStyles} />
      </div>
    </main>
  );
}
