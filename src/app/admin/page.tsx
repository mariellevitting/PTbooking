import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "miemarielle@live.no";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const [
    { data: profiles },
    { data: feedback },
    { data: bookings },
  ] = await Promise.all([
    supabase.from("profiles").select("id, name, role, created_at").order("created_at", { ascending: false }),
    supabase.from("feedback").select("*").order("created_at", { ascending: false }),
    supabase.from("bookings").select("id, created_at, status").order("created_at", { ascending: false }),
  ]);

  const dancers = profiles?.filter(p => p.role === "dancer") ?? [];
  const parents = profiles?.filter(p => p.role === "parent") ?? [];
  const trainers = profiles?.filter(p => p.role === "trainer") ?? [];

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} dag${days > 1 ? "er" : ""} siden`;
    if (hours > 0) return `${hours} time${hours > 1 ? "r" : ""} siden`;
    return `${mins} min siden`;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Kun synlig for deg</p>
        </div>

        {/* Statistikk */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Totalt brukere", value: profiles?.length ?? 0, color: "bg-purple-600" },
            { label: "Dansere", value: dancers.length, color: "bg-blue-500" },
            { label: "Foreldre", value: parents.length, color: "bg-green-500" },
            { label: "Trenere", value: trainers.length, color: "bg-orange-500" },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5 text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Tilbakemeldinger */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">
              Tilbakemeldinger <span className="text-purple-600 ml-1">{feedback?.length ?? 0}</span>
            </h2>
            {!feedback?.length ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Ingen tilbakemeldinger ennå</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {feedback.map(f => (
                  <div key={f.id} className="border dark:border-gray-700 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{f.user_name}</p>
                      <span className="text-xs text-gray-400">{timeAgo(f.created_at)}</span>
                    </div>
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{f.role}</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{f.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nye brukere */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">
              Nye brukere <span className="text-purple-600 ml-1">{profiles?.length ?? 0}</span>
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {profiles?.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-sm shrink-0">
                      {p.name?.charAt(0) ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{p.name}</p>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{p.role}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-2">{timeAgo(p.created_at)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bookinger */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-2">
            Totalt bookinger <span className="text-purple-600 ml-1">{bookings?.length ?? 0}</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Bekreftede: <strong>{bookings?.filter(b => b.status === "confirmed").length ?? 0}</strong>
            {" · "}
            Avbestilte: <strong>{bookings?.filter(b => b.status === "cancelled").length ?? 0}</strong>
          </p>
        </div>

      </div>
    </div>
  );
}
