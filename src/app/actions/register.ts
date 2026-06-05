"use server";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: UserRole,
  trainerCode?: string,
  dancerNames?: string[]
): Promise<{ error?: string }> {
  if (role === "trainer") {
    if (!trainerCode || trainerCode !== process.env.TRAINER_INVITE_CODE) {
      return { error: "Feil trenerkode. Ta kontakt med klubben for å få riktig kode." };
    }
  }

  const supabase = await createClient();

  const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError || !data.user) {
    return { error: signUpError?.message ?? "Noe gikk galt" };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    name,
    role,
    email,
  });

  if (profileError) {
    return { error: "Kunne ikke opprette profil" };
  }

  if (role === "parent" && dancerNames && dancerNames.length > 0) {
    await supabase.from("children").insert(
      dancerNames.map(name => ({ parent_id: data.user!.id, name }))
    );
  }

  return {};
}
