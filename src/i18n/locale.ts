// Delte hjelpere for språkvalg. Se docs/DECISIONS.md ("Flerspråklighet") for hele oppsettet.
//
// VIKTIG: språk her betyr KUN UI-språk. Ikke koble dette til land, valuta
// eller tidssone noe sted – de kan trenge egne innstillinger senere.

export type Locale = "no" | "en";

export const LOCALES: Locale[] = ["no", "en"];
export const DEFAULT_LOCALE: Locale = "no";

// Navn på cookien som speiler gjeldende språk (satt av proxy.ts og av språkvelgeren).
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "no" || value === "en";
}

// Vår interne "no" tilsvarer bokmål (nb) i HTML lang-attributtet.
export function htmlLang(locale: Locale): string {
  return locale === "no" ? "nb" : "en";
}

/**
 * Enkel tolkning av Accept-Language: norsk enhet (nb/nn/no) -> "no",
 * alle andre språk -> "en". Mangler headeren helt, beholdes dagens
 * standardspråk ("no").
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const primary = header.split(",")[0]?.trim().toLowerCase() ?? "";
  if (primary.startsWith("nb") || primary.startsWith("nn") || primary.startsWith("no")) return "no";
  return "en";
}
