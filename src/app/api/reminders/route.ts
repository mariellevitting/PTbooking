import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Denne ruten kalles én gang om morgenen og sender "du har privattime i dag"-varsler
// til alle som har booking i dag (både danser/forelder og instruktør)
export async function GET(request: Request) {
  // Enkel sikkerhet: sjekk at kallet kommer med riktig secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Finn start og slutt for dagens dato
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Hent alle bekreftede bookinger i dag med slot- og booker-info
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      id,
      booker_id,
      dancer_name,
      dance_style,
      availability_slots (
        start_at,
        trainer_id
      )
    `)
    .eq("status", "confirmed")
    .gte("availability_slots.start_at", todayStart.toISOString())
    .lte("availability_slots.start_at", todayEnd.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ message: "Ingen timer i dag", sent: 0 });
  }

  // Tell hvor mange timer hver bruker har i dag
  const bookerCount: Record<string, number> = {};
  const trainerCount: Record<string, number> = {};

  for (const booking of bookings) {
    const slot = Array.isArray(booking.availability_slots)
      ? booking.availability_slots[0]
      : booking.availability_slots;
    if (!slot) continue;

    bookerCount[booking.booker_id] = (bookerCount[booking.booker_id] || 0) + 1;
    trainerCount[slot.trainer_id] = (trainerCount[slot.trainer_id] || 0) + 1;
  }

  // Bygg opp varsler
  const notifications: { user_id: string; message: string }[] = [];

  for (const [userId, count] of Object.entries(bookerCount)) {
    notifications.push({
      user_id: userId,
      message:
        count === 1
          ? "Du har 1 privattime i dag 🎉"
          : `Du har ${count} privattimer i dag 🎉`,
    });
  }

  for (const [userId, count] of Object.entries(trainerCount)) {
    notifications.push({
      user_id: userId,
      message:
        count === 1
          ? "Du har 1 privattime i dag 🎉"
          : `Du har ${count} privattimer i dag 🎉`,
    });
  }

  // Sett inn varsler (ignorer duplikater hvis ruten kjøres to ganger)
  const { error: insertError } = await supabase
    .from("notifications")
    .insert(notifications);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Varsler sendt", sent: notifications.length });
}
