"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function togglePin(trainerId: string, isPinned: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (isPinned) {
    await supabase.from("pinned_trainers").delete()
      .eq("user_id", user.id)
      .eq("trainer_id", trainerId);
  } else {
    await supabase.from("pinned_trainers").insert({ user_id: user.id, trainer_id: trainerId });
  }

  revalidatePath("/book");
}
