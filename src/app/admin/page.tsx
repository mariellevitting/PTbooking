import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "miemarielle@live.no";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id ?? "").single();
  if (!user || profile?.role !== "trainer") redirect("/dashboard");

  const isAdmin = user.email === ADMIN_EMAIL;

  const [
    { data: profiles },
    { data: feedback },
    { data: rawSlots },
    { data: rawBookings },
    { data: clubs },
  ] = await Promise.all([
    supabase.from("profiles").select("id, name, role, created_at, club_id").order("created_at", { ascending: false }),
    isAdmin ? supabase.from("feedback").select("*, profiles!feedback_user_id_fkey(club_id)").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    supabase.from("availability_slots").select("id, start_at, end_at, trainer_id").gte("start_at", new Date().toISOString()).order("start_at").limit(200) as any,
    supabase.from("bookings").select("id, slot_id, dancer_name, dance_style, status").eq("status", "confirmed").limit(200) as any,
    supabase.from("clubs").select("id, name, invite_code, trainer_code, dancer_code, parent_code, created_at").order("created_at"),
  ]);

  // Merge bookings into slots
  const bookingsBySlot: Record<string, any[]> = {};
  for (const b of rawBookings ?? []) {
    if (!bookingsBySlot[b.slot_id]) bookingsBySlot[b.slot_id] = [];
    bookingsBySlot[b.slot_id].push(b);
  }
  const slots = (rawSlots ?? []).map((s: any) => ({ ...s, bookings: bookingsBySlot[s.id] ?? [] }));
  const bookings = slots;

  const trainerMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    if (p.role === "trainer") trainerMap[p.id] = p.name;
  }

  return (
    <AdminClient
      profiles={profiles ?? []}
      feedback={isAdmin ? (feedback ?? []) : []}
      bookings={bookings ?? []}
      slots={slots ?? []}
      trainerMap={trainerMap}
      isAdmin={isAdmin}
      clubs={clubs ?? []}
    />
  );
}
