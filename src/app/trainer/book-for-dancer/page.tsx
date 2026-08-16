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
        <Link href="/trainer/dashboard" className="inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-[#E2A9F1]/10 text-[#E2A9F1] mb-2 -ml-2">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </Link>
        <h1 className="text-2xl font-bold mb-6">Book time for danser</h1>
        <BookForDancerForm trainerId={user.id} danceStyles={danceStyles} />
      </div>
    </main>
  );
}
