import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";

export default async function ParentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Hei, {profile.name}!</h1>
          <LogoutButton />
        </div>
        <p className="text-gray-500 mb-8">Evolution Dance Studio</p>

        <div className="bg-white rounded-xl border p-6 text-center text-gray-400">
          <p className="text-lg font-medium mb-2">Ingen bookede timer</p>
          <p className="text-sm mb-6">Book privattime for ditt barn</p>
          <Button className="bg-purple-600 hover:bg-purple-700">
            Book privattime
          </Button>
        </div>
      </div>
    </main>
  );
}
