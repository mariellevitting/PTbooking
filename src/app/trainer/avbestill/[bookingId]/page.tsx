import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TrainerCancelForm from "./TrainerCancelForm";

export default async function TrainerAvbestillPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, availability_slots!inner(start_at, end_at, trainer_id)")
    .eq("id", bookingId)
    .eq("availability_slots.trainer_id", user.id)
    .single();

  if (!booking) redirect("/trainer/dashboard");

  // Ikke tillat avbestilling av gjennomførte timer
  if (new Date(booking.availability_slots.end_at) < new Date()) redirect("/trainer/dashboard");

  return (
    <main className="bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Avbestill time</h1>
        <TrainerCancelForm
          bookingId={bookingId}
          slotId={booking.slot_id}
          bookerId={booking.booker_id}
          dancerName={booking.dancer_name}
          danceStyle={booking.dance_style}
          startAt={booking.availability_slots.start_at}
        />
      </div>
    </main>
  );
}
