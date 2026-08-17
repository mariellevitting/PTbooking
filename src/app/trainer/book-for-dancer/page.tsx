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
    <main className="bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-lg mx-auto">
        <Link href="/trainer/dashboard" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200 mb-2 -ml-2">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </Link>
        <h1 className="text-2xl font-bold mb-6">Book time for danser</h1>
        <BookForDancerForm trainerId={user.id} danceStyles={danceStyles} />
      </div>
    </main>
  );
}
