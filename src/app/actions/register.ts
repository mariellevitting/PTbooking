"use server";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: UserRole,
  trainerCode?: string,
  dancerNames?: string[],
  clubInviteCode?: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  if (!trainerCode) return { error: "Du må oppgi en klubbkode." };

  // Evolution bruker fortsatt miljøvariabel-koder (bakoverkompatibilitet).
  const isEvolutionCode =
    (role === "trainer" && trainerCode === process.env.TRAINER_INVITE_CODE) ||
    (role === "dancer" && trainerCode === process.env.DANCER_INVITE_CODE) ||
    (role === "parent" && trainerCode === process.env.PARENT_INVITE_CODE);

  let clubId: string | null = null;

  if (isEvolutionCode) {
    const { data } = await supabase.from("clubs").select("id").eq("invite_code", "EVOLUTION").single();
    clubId = data?.id ?? null;
  }

  // Andre klubber: kodene sjekkes server-side via en sikret DB-funksjon,
  // så de aldri eksponeres i det offentlige API-et.
  if (!clubId) {
    const { data } = await supabase.rpc("verify_club_code", { p_code: trainerCode, p_role: role });
    clubId = (data as string | null) ?? null;
  }

  if (!clubId) return { error: "Feil kode. Ta kontakt med klubben din for å få riktig kode." };

  const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError || !data.user) {
    return { error: signUpError?.message ?? "Noe gikk galt" };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    name,
    role,
    email,
    club_id: clubId,
  });

  if (profileError) {
    return { error: "Kunne ikke opprette profil" };
  }

  if (role === "parent" && dancerNames && dancerNames.length > 0) {
    await supabase.from("children").insert(
      dancerNames.map(name => ({ parent_id: data.user?.id ?? "", name }))
    );
  }

  return {};
}
