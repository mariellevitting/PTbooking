import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "miemarielle@live.no";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const [
    { data: profiles },
    { data: feedback },
    { data: bookings },
    { data: slots },
  ] = await Promise.all([
    supabase.from("profiles").select("id, name, role, created_at").order("created_at", { ascending: false }),
    supabase.from("feedback").select("*").order("created_at", { ascending: false }),
    supabase.from("bookings").select("id, dancer_name, dance_style, status, availability_slots(id, start_at, end_at, trainer_id)").order("created_at", { ascending: false }),
    supabase.from("availability_slots").select("id, start_at, end_at, trainer_id").gte("start_at", new Date().toISOString()).order("start_at").limit(200),
  ]);

  const trainerMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    if (p.role === "trainer") trainerMap[p.id] = p.name;
  }

  return (
    <AdminClient
      profiles={profiles ?? []}
      feedback={feedback ?? []}
      bookings={bookings ?? []}
      slots={slots ?? []}
      trainerMap={trainerMap}
    />
  );
}
