import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function TrainerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-1">Hei, {profile.name}!</h1>
        <p className="text-gray-500 mb-8">Evolution Dance Studio – Trener</p>

        <div className="bg-white rounded-xl border p-6 text-center text-gray-400">
          <p className="text-lg font-medium mb-2">Ingen kommende bookinger</p>
          <p className="text-sm mb-6">Legg ut ledige tider så dansere kan booke deg</p>
          <Button className="bg-purple-600 hover:bg-purple-700">
            Legg ut ledige tider
          </Button>
        </div>
      </div>
    </main>
  );
}
