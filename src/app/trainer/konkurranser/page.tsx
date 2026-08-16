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
    <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 min-h-screen page-safe-top">
      <div className="max-w-lg mx-auto">
        <Link href="/trainer/dashboard" className="inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-[#E2A9F1]/10 text-[#E2A9F1] mb-2 -ml-2">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </Link>
        <h1 className="text-2xl font-bold mb-6">Kommende konkurranser</h1>

        {upcoming.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Ingen kommende konkurranser</p>
        )}

        {next && (
          <div className="bg-[#3A3A3A] rounded-2xl px-5 py-4 mb-3">
            <p className="text-xs text-[#e8c4f5] font-semibold uppercase tracking-wide mb-1">🏆 Neste konkurranse</p>
            <p className="text-lg font-bold text-white">{next.short}</p>
            <p className="text-sm text-[#e8c4f5] mt-0.5">{next.dateLabel}{next.location ? ` · ${next.location}` : ""}</p>
            <div className="mt-3 flex items-end gap-1">
              <p className="text-4xl font-bold text-white">{daysUntil(next.date)}</p>
              <p className="text-sm text-[#e8c4f5] mb-1">dager igjen</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {rest.map(c => (
            <div key={c.short} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{c.short}</p>
                <p className="text-sm text-[#E2A9F1]">{c.dateLabel}</p>
                {c.location && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{c.location}</p>}
              </div>
              <span className="text-xs font-bold text-[#E2A9F1] bg-[#f5eeff] dark:bg-[#E2A9F1]/10 px-2 py-1 rounded-full whitespace-nowrap ml-3">
                {daysUntil(c.date)} dager
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
