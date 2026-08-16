import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfilForm from "./ProfilForm";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  trainer: "Trener",
  dancer: "Danser",
  parent: "Forelder",
};

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

  const isAdmin = user.email === "miemarielle@live.no";

  const { data: allUsers } = isAdmin ? await supabase
    .from("profiles")
    .select("id, name, role, email")
    .order("role")
    .order("name") : { data: null };

  return (
    <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 page-safe-top">
      <div className="max-w-lg mx-auto">
        <Link href="/trainer/dashboard" className="inline-flex items-center gap-1 text-sm text-[#E2A9F1] hover:underline mb-6">
          <ArrowLeft size={16} /> Tilbake
        </Link>
        <h1 className="text-2xl font-bold mb-6">Min profil</h1>
        <ProfilForm
          userId={user.id}
          name={profile.name}
          phone={profile.phone ?? ""}
          bio={trainerDetails?.bio ?? ""}
          danceStyles={trainerDetails?.dance_styles ?? []}
          avatarUrl={profile.avatar_url ?? null}
        />

        {isAdmin && allUsers && (
          <>
            {/* Statistikk */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5 mt-6">
              <h2 className="font-semibold text-base flex items-center gap-2 mb-4">
                <Users size={16} className="text-[#E2A9F1]" />
                Registrerte brukere ({allUsers.length})
              </h2>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {(["trainer", "dancer", "parent"] as const).map((role) => (
                  <div key={role} className="bg-[#f5eeff] rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-[#E2A9F1]">
                      {allUsers.filter(u => u.role === role).length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ROLE_LABEL[role]}e{role === "trainer" ? "" : ""}</p>
                  </div>
                ))}
              </div>

              {/* Brukerliste */}
              <div className="space-y-1">
                {allUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#edd5f9] flex items-center justify-center text-[#E2A9F1] font-bold text-xs shrink-0">
                        {u.name.charAt(0)}
                      </div>
                        <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        {u.email && <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      u.role === "trainer" ? "bg-[#edd5f9] text-[#E2A9F1]" :
                      u.role === "dancer" ? "bg-blue-100 text-blue-600" :
                      "bg-green-100 text-green-600"
                    }`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
