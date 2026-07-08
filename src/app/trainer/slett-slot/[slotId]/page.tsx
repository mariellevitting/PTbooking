import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeleteSlotForm from "./DeleteSlotForm";

export default async function SlettSlotPage({ params }: { params: Promise<{ slotId: string }> }) {
  const { slotId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: slot } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("id", slotId)
    .eq("trainer_id", user.id)
    .eq("is_booked", false)
    .single();

  if (!slot) redirect("/trainer/dashboard");

  return (
    <main className="bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Slett ledig tid</h1>
        <DeleteSlotForm slotId={slotId} startAt={slot.start_at} endAt={slot.end_at} />
      </div>
    </main>
  );
}
