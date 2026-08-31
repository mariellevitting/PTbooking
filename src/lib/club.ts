import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Klubb-konfigurasjon. Alt klubb-spesifikt innhold (navn, priser, betaling,
 * info-tekst, dansestiler) ligger på clubs-raden i databasen – ikke i koden.
 * Se supabase/club_config.sql og docs/CLUBS.md.
 */
export interface ClubConfig {
  id: string;
  name: string;
  short_name: string | null;
  city: string | null;
  primary_color: string | null;
  website: string | null;
  lesson_info: string | null;
  lesson_duration_min: number | null;
  lesson_price_text: string | null;
  default_price: number | null;
  payment_label: string | null;
  payment_info: string | null;
  payment_url: string | null;
  receipt_note: string | null;
  dance_styles: string[] | null;
}

/** Brukes når en verdi mangler på klubben, eller når det ikke finnes klubb-kontekst. */
export const CLUB_DEFAULTS = {
  lesson_duration_min: 30,
  default_price: 150,
  dance_styles: [
    "Slow",
    "Freestyle",
    "Jazz",
    "Moderne",
    "Freestyle dobbel",
    "Slow dobbel",
    "Akro",
    "Hiphop",
    "Show",
  ],
  payment_info: "Avtal betaling med treneren.",
  receipt_note: "Husk kvittering for betalt privattime til timen.",
} as const;

const CLUB_COLUMNS =
  "id, name, short_name, city, primary_color, website, lesson_info, lesson_duration_min, lesson_price_text, default_price, payment_label, payment_info, payment_url, receipt_note, dance_styles";

/** Henter klubb-konfig for en gitt klubb-id. */
export async function getClubById(
  supabase: SupabaseClient,
  clubId: string | null | undefined
): Promise<ClubConfig | null> {
  if (!clubId) return null;
  const { data } = await supabase.from("clubs").select(CLUB_COLUMNS).eq("id", clubId).single();
  return (data as ClubConfig) ?? null;
}

/** Henter klubb-konfig for den innloggede brukeren. */
export async function getClubForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ClubConfig | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id")
    .eq("id", userId)
    .single();
  return getClubById(supabase, profile?.club_id);
}

export function danceStylesFor(club: ClubConfig | null): string[] {
  return club?.dance_styles && club.dance_styles.length > 0
    ? club.dance_styles
    : [...CLUB_DEFAULTS.dance_styles];
}

export function defaultPriceFor(club: ClubConfig | null): number {
  return club?.default_price ?? CLUB_DEFAULTS.default_price;
}
