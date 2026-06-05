import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CancelForm from "./CancelForm";

export default async function AvbestillPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const dashboardUrl = profile?.role === "parent" ? "/parent/dashboard" : "/dancer/dashboard";

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, availability_slots(start_at, end_at, trainer_id)")
    .eq("id", bookingId)
    .eq("booker_id", user.id)
    .single();

  if (!booking) redirect(dashboardUrl);

  const start = new Date(booking.availability_slots.start_at);
  const now = new Date();
  const hoursUntil = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
  const withinDeadline = hoursUntil < 24;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Avbestill time</h1>
        <CancelForm
          bookingId={bookingId}
          slotId={booking.slot_id}
          trainerId={booking.availability_slots.trainer_id}
          dancerName={booking.dancer_name}
          danceStyle={booking.dance_style}
          startAt={booking.availability_slots.start_at}
          withinDeadline={withinDeadline}
          dashboardUrl={dashboardUrl}
        />
      </div>
    </main>
  );
}
