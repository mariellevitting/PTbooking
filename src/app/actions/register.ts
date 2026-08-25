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

  // Finn klubben basert på rolle-koden
  const { data: allClubs } = await supabase
    .from("clubs")
    .select("id, name, trainer_code, dancer_code, parent_code");

  // Sjekk env-koder for Evolution (bakoverkompatibilitet)
  const evolutionClub = allClubs?.find(c => !c.trainer_code && !c.dancer_code && !c.parent_code);
  const isEvolutionCode =
    (role === "trainer" && trainerCode === process.env.TRAINER_INVITE_CODE) ||
    (role === "dancer" && trainerCode === process.env.DANCER_INVITE_CODE) ||
    (role === "parent" && trainerCode === process.env.PARENT_INVITE_CODE);

  let club = isEvolutionCode ? evolutionClub : null;

  // Sjekk klubb-spesifikke koder
  if (!club) {
    club = allClubs?.find(c => {
      if (role === "trainer") return c.trainer_code === trainerCode;
      if (role === "dancer") return c.dancer_code === trainerCode;
      if (role === "parent") return c.parent_code === trainerCode;
      return false;
    }) ?? null;
  }

  if (!club) return { error: "Feil kode. Ta kontakt med klubben din for å få riktig kode." };

  const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError || !data.user) {
    return { error: signUpError?.message ?? "Noe gikk galt" };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    name,
    role,
    email,
    club_id: club?.id ?? null,
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
