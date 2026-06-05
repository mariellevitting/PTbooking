import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BookingForm from "./BookingForm";

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
    .select("id, name")
    .eq("id", trainerId)
    .eq("role", "trainer")
    .single();

  if (!trainer) redirect("/book");

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("trainer_id", trainerId)
    .eq("is_booked", false)
    .gte("start_at", new Date().toISOString())
    .order("start_at");

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <Link href="/book" className="text-sm text-purple-600 hover:underline mb-6 block">
          ← Velg annen trener
        </Link>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl">
            {trainer.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{trainer.name}</h1>
            <p className="text-gray-400 text-sm">Trener – Evolution Dance Studio</p>
          </div>
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
          />
        )}
      </div>
    </main>
  );
}
