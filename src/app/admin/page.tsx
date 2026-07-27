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
    { data: slots },
  ] = await Promise.all([
    supabase.from("profiles").select("id, name, role, created_at").order("created_at", { ascending: false }),
    supabase.from("feedback").select("*").order("created_at", { ascending: false }),
    supabase
      .from("availability_slots")
      .select("id, start_at, end_at, trainer_id, profiles!availability_slots_trainer_id_fkey(name), bookings(id, dancer_name, dance_style, status, booker_id, profiles!bookings_booker_id_fkey(name))")
      .order("start_at", { ascending: false })
      .limit(200),
  ]);

  return (
    <AdminClient
      profiles={profiles ?? []}
      feedback={feedback ?? []}
      slots={slots ?? []}
    />
  );
}
