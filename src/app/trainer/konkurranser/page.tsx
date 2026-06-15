import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const COMPETITIONS = [
  { short: "NM", name: "Norgesmesterskapet 2026", date: new Date("2026-06-13T00:00:00"), dateLabel: "13–14. juni", location: "Sofiemyrhallen, Sofienmyr" },
  { short: "FDJ 6", name: "Freestyle Dance Jam 6", date: new Date("2026-08-22T00:00:00"), dateLabel: "22. august", location: "Gausdal Arena, Lillehammer" },
  { short: "FDJ 7", name: "Freestyle Dance Jam 7", date: new Date("2026-09-19T00:00:00"), dateLabel: "19. september", location: null },
  { short: "FDJ 8", name: "Freestyle Dance Jam 8", date: new Date("2026-10-17T00:00:00"), dateLabel: "17. oktober", location: "Fjellhamar Arena, Lørenskog" },
  { short: "DOTY / FDJ 9", name: "Dancer of the Year / FDJ 9", date: new Date("2026-11-21T00:00:00"), dateLabel: "21. november", location: null },
];

function daysUntil(date: Date) {
  return Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

export default async function TrainerKonkurranserPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  const upcoming = COMPETITIONS.filter(c => daysUntil(c.date) > 0);
  const next = upcoming[0];
  const rest = upcoming.slice(1);

  return (
    <main className="bg-gray-50 p-6 min-h-screen">
      <div className="max-w-lg mx-auto">
        <Link href="/trainer/dashboard" className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline mb-6">
          <ArrowLeft size={16} /> Tilbake
        </Link>
        <h1 className="text-2xl font-bold mb-6">Kommende konkurranser</h1>

        {upcoming.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">Ingen kommende konkurranser</p>
        )}

        {next && (
          <div className="bg-purple-600 rounded-2xl px-5 py-4 mb-3">
            <p className="text-xs text-purple-200 font-semibold uppercase tracking-wide mb-1">🏆 Neste konkurranse</p>
            <p className="text-lg font-bold text-white">{next.short}</p>
            <p className="text-sm text-purple-200 mt-0.5">{next.dateLabel}{next.location ? ` · ${next.location}` : ""}</p>
            <div className="mt-3 flex items-end gap-1">
              <p className="text-4xl font-bold text-white">{daysUntil(next.date)}</p>
              <p className="text-sm text-purple-200 mb-1">dager igjen</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {rest.map(c => (
            <div key={c.short} className="bg-white rounded-xl border p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{c.short}</p>
                <p className="text-sm text-purple-600">{c.dateLabel}</p>
                {c.location && <p className="text-xs text-gray-400 mt-0.5">{c.location}</p>}
              </div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full whitespace-nowrap ml-3">
                {daysUntil(c.date)} dager
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
