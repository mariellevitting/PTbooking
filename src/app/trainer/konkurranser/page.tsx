import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CompetitionList from "@/components/CompetitionList";

export default async function TrainerKonkurranserPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, club_id").eq("id", user.id).single();
  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  return (
    <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 min-h-screen page-safe-top">
      <div className="max-w-lg mx-auto">
        <Link href="/trainer/dashboard" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200 mb-2 -ml-2">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </Link>
        <h1 className="text-2xl font-bold mb-6">Kommende konkurranser</h1>
        <CompetitionList userId={user.id} showCountdown isTrainer clubId={(profile as any).club_id ?? null} />
      </div>
    </main>
  );
}
