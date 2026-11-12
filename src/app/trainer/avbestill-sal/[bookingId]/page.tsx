import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TrainerCancelRoomForm from "./TrainerCancelRoomForm";

export default async function TrainerAvbestillSalPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  // RLS begrenser dette til bookinger i egen klubb
  const { data: booking } = await supabase
    .from("room_bookings")
    .select("id, slot_id, booker_id, dancer_name, status, room_slots(start_at, end_at, rooms(name))")
    .eq("id", bookingId)
    .single();

  if (!booking || booking.status !== "confirmed") redirect("/trainer/saler");

  const slot = booking.room_slots as any;
  if (!slot) redirect("/trainer/saler");

  // Ikke tillat avbestilling av gjennomførte økter
  if (new Date(slot.end_at) < new Date()) redirect("/trainer/saler");

  return (
    <main className="bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="font-display text-[28px] mb-6">Avbestill egentrening</h1>
        <TrainerCancelRoomForm
          bookingId={booking.id}
          bookerId={booking.booker_id}
          dancerName={booking.dancer_name}
          roomName={slot.rooms?.name ?? "Sal"}
          startAt={slot.start_at}
        />
      </div>
    </main>
  );
}
