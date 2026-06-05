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
    <main className="bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <Link href="/book" className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline mb-6">
          <ArrowLeft size={16} /> Velg annen trener
        </Link>

        {/* Trener-kort */}
        <div className="bg-white rounded-2xl border p-5 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl shrink-0">
              {trainer.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{trainer.name}</h1>
              <p className="text-gray-400 text-sm">Trener – Evolution Danseklubb</p>
            </div>
          </div>

          {trainerDetails?.bio && (
            <p className="text-sm text-gray-600 mb-4">{trainerDetails.bio}</p>
          )}

          {styles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {styles.map((style) => (
                <span key={style} className="text-xs bg-purple-50 text-purple-600 border border-purple-100 px-2.5 py-1 rounded-full">
                  {style}
                </span>
              ))}
            </div>
          )}

          {trainer.phone && (
            <a href={`tel:${trainer.phone}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600">
              <Phone size={14} /> {trainer.phone}
            </a>
          )}
        </div>

        {!slots || slots.length === 0 ? (
          <div className="bg-white rounded-xl border p-6 text-center text-gray-400">
            <p className="font-medium mb-1">Ingen ledige tider</p>
            <p className="text-sm">Treneren har ikke lagt ut ledige tider ennå</p>
          </div>
        ) : (
          <BookingForm
            slots={slots}
            trainerId={trainerId}
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
