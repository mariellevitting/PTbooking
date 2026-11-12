import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SalBookingClient from "./SalBookingClient";

export default async function SalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role, club_id")
    .eq("id", user.id)
    .single();

  if (!profile || !["dancer", "parent"].includes(profile.role)) redirect("/dashboard");

  const backHref = profile.role === "parent" ? "/parent/dashboard" : "/dancer/dashboard";

  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("club_id", profile.club_id ?? "")
    .order("sort_order");

  const roomIds = (rooms ?? []).map(r => r.id);

  const now = new Date().toISOString();

  const [{ data: allSlots }, { data: kids }, { data: myBookings }] = await Promise.all([
    roomIds.length > 0
      ? supabase
          .from("room_slots")
          .select("id, room_id, start_at, end_at, is_booked")
          .in("room_id", roomIds)
          .gte("start_at", now)
          .order("start_at")
      : Promise.resolve({ data: [] }),
    profile.role === "parent"
      ? supabase.from("children").select("id, name").eq("parent_id", user.id)
      : Promise.resolve({ data: [] }),
    supabase
      .from("room_bookings")
      .select("id, dancer_name, status, created_at, room_slots(start_at, end_at, rooms(name))")
      .eq("booker_id", user.id)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false }),
  ]);

  // Bare fremtidige egne bookinger
  const upcomingMyBookings = (myBookings ?? []).filter((b: any) => {
    const slot = b.room_slots;
    return slot && new Date(slot.start_at) >= new Date();
  });

  return (
    <SalBookingClient
      rooms={rooms ?? []}
      allSlots={(allSlots ?? []) as any}
      userId={user.id}
      userName={profile.name}
      role={profile.role}
      clubId={profile.club_id ?? null}
      kids={kids ?? []}
      myBookings={upcomingMyBookings as any}
      backHref={backHref}
    />
  );
}
