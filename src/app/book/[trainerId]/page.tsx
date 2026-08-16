import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BookingForm from "./BookingForm";
import { ArrowLeft, Phone } from "lucide-react";

export default async function TrainerBookPage({ params }: { params: Promise<{ trainerId: string }> }) {
  const { trainerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: trainer } = await supabase
    .from("profiles")
    .select("id, name, phone")
    .eq("id", trainerId)
    .eq("role", "trainer")
    .single();

  if (!profile || !["dancer", "parent"].includes(profile.role)) redirect("/dashboard");
  if (!trainer) redirect("/book");

  const { data: trainerDetails } = await supabase
    .from("trainers")
    .select("dance_styles, bio")
    .eq("id", trainerId)
    .single();

  const { data: children } = await supabase
    .from("children")
    .select("id, name")
    .eq("parent_id", user.id);

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("trainer_id", trainerId)
    .gte("start_at", new Date().toISOString())
    .order("start_at");

  const DEFAULT_STYLES = ["Slow", "Freestyle", "Jazz", "Moderne", "Freestyle dobbel", "Slow dobbel", "Akro"];
  const styles: string[] = (trainerDetails?.dance_styles?.length ?? 0) > 0
    ? trainerDetails!.dance_styles
    : DEFAULT_STYLES;

  return (
    <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 page-safe-top">
      <div className="max-w-lg mx-auto">
        <Link href="/book" className="inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-[#E2A9F1]/10 text-[#E2A9F1] mb-2 -ml-2">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </Link>

        {/* Trener-kort */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center text-[#E2A9F1] font-bold text-xl shrink-0">
              {trainer.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{trainer.name}</h1>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Trener – Evolution Danseklubb</p>
            </div>
          </div>

          {trainerDetails?.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{trainerDetails.bio}</p>
          )}

          {styles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {styles.map((style) => (
                <span key={style} className="text-xs bg-[#f5eeff] dark:bg-[#E2A9F1]/10 text-[#E2A9F1] border border-[#E2A9F1]/30 px-2.5 py-1 rounded-full">
                  {style}
                </span>
              ))}
            </div>
          )}

          {trainer.phone && (
            <a href={`tel:${trainer.phone}`} className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-[#E2A9F1]">
              <Phone size={14} /> {trainer.phone}
            </a>
          )}
        </div>

        {!slots || slots.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-6 text-center text-gray-400 dark:text-gray-500">
            <p className="font-medium mb-1">Ingen ledige tider</p>
            <p className="text-sm">Treneren har ikke lagt ut ledige tider ennå</p>
          </div>
        ) : (
          <BookingForm
            slots={slots}
            trainerId={trainerId}
            trainerName={trainer.name}
            bookerId={user.id}
            bookerName={profile?.name ?? ""}
            bookerRole={profile?.role ?? "dancer"}
            danceStyles={styles}
            children={children ?? []}
          />
        )}
      </div>
    </main>
  );
}
