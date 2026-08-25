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

  // Finn klubben basert på invitasjonskode, fallback til Evolution
  const code = clubInviteCode?.toUpperCase() || "EVOLUTION";
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, trainer_code, dancer_code, parent_code")
    .eq("invite_code", code)
    .single();

  if (!club) return { error: "Ugyldig klubbkode. Ta kontakt med klubben din." };

  // Sjekk rolle-kode: bruk klubbens egne koder hvis de finnes, ellers env-variabler (Evolution)
  if (role === "trainer") {
    const expected = club.trainer_code ?? process.env.TRAINER_INVITE_CODE;
    if (!trainerCode || trainerCode !== expected) {
      return { error: "Feil trenerkode. Ta kontakt med klubben for å få riktig kode." };
    }
  }

  if (role === "dancer") {
    const expected = club.dancer_code ?? process.env.DANCER_INVITE_CODE;
    if (!trainerCode || trainerCode !== expected) {
      return { error: "Feil klubbkode for danser. Ta kontakt med klubben din for å få riktig kode." };
    }
  }

  if (role === "parent") {
    const expected = club.parent_code ?? process.env.PARENT_INVITE_CODE;
    if (!trainerCode || trainerCode !== expected) {
      return { error: "Feil klubbkode for forelder. Ta kontakt med klubben din for å få riktig kode." };
    }
  }

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
