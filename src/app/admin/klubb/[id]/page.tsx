import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ClubSettingsForm from "./ClubSettingsForm";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "miemarielle@live.no";

export default async function AdminClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const { data: clubs } = await supabase.rpc("admin_list_clubs");
  const club = (clubs as any[] | null)?.find(c => c.id === id) ?? null;
  if (!club) redirect("/admin");

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 page-safe-top">
      <div className="max-w-lg mx-auto">
        <a href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#E2A9F1] mb-4">
          ← Tilbake til admin
        </a>
        <h1 className="text-2xl font-bold mb-1">{club.name}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Klubb-innstillinger</p>
        <ClubSettingsForm club={club} />
      </div>
    </main>
  );
}
