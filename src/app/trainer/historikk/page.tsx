import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { formatDate, formatTime } from "@/lib/dateUtils";
import DancerSearch from "./DancerSearch";

export default async function TrainerHistorikkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, club_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  const [{ data: completedSlots }, { data: dancerProfiles }] = await Promise.all([
    supabase
      .from("availability_slots")
      .select("*, bookings(id, dancer_name, dance_style, status)")
      .eq("trainer_id", user.id)
      .lt("end_at", new Date().toISOString())
      .order("start_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, name")
      .eq("role", "dancer")
      .eq("club_id", profile.club_id ?? ""),
  ]);

  const completed = (completedSlots ?? []).filter(slot =>
    slot.bookings?.some((b: any) => b.status === "confirmed")
  );

  // Grupper per måned
  const monthGroups: Record<string, typeof completed> = {};
  for (const slot of completed) {
    const d = new Date(slot.start_at);
    const key = formatDate(d, { month: "long", year: "numeric" });
    if (!monthGroups[key]) monthGroups[key] = [];
    monthGroups[key].push(slot);
  }

  return (
    <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 page-safe-top">
      <div className="max-w-lg mx-auto">
        <Link href="/trainer/dashboard" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200 mb-2 -ml-2">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </Link>

        <DancerSearch
          slots={(completedSlots ?? []).map(s => ({
            id: s.id,
            start_at: s.start_at,
            end_at: s.end_at,
            bookings: s.bookings ?? null,
          }))}
          profiles={(dancerProfiles ?? []).map(p => ({ id: p.id, name: p.name }))}
        />

        <div className="flex items-baseline gap-2 mb-6">
          <h1 className="text-2xl font-bold">Gjennomførte privattimer</h1>
          {completed.length > 0 && (
            <span className="text-sm text-[#E2A9F1]">{completed.length} totalt</span>
          )}
        </div>

        {completed.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500">
            <p className="font-medium">Ingen gjennomførte timer ennå</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(monthGroups).map(([month, monthSlots]) => (
              <div key={month}>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{month}</p>
                <div className="space-y-2">
                  {monthSlots.map((slot) => {
                    const start = new Date(slot.start_at);
                    const end = new Date(slot.end_at);
                    const booking = slot.bookings?.find((b: any) => b.status === "confirmed");
                    const dayLabel = formatDate(start, { weekday: "long", day: "numeric", month: "long" });
                    return (
                      <div key={slot.id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                              {formatTime(start)}–{formatTime(end)}
                            </p>
                            {booking && (
                              <p className="text-sm text-[#E2A9F1] mt-0.5">
                                {booking.dancer_name} · {booking.dance_style}
                              </p>
                            )}
                          </div>
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full">Fullført</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
