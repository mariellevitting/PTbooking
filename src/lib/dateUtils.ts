import type { Locale } from "@/i18n/locale";

const TZ = "Europe/Oslo";

// Norsk UI -> nb-NO. Engelsk UI -> en-GB (europeisk datoformat, ikke amerikansk
// MM/DD – klubbene er norske, så DD/MM er det brukerne uansett kjenner igjen).
// NB: dette er kun visningsspråk. Selve tidssonen forblir Europe/Oslo uansett
// språk – språk og tidssone/valuta/land skal IKKE kobles sammen (se docs/DECISIONS.md).
function toIntlLocale(locale: Locale): string {
  return locale === "no" ? "nb-NO" : "en-GB";
}

export function formatDate(date: Date, locale: Locale, options: Intl.DateTimeFormatOptions = {}) {
  return date.toLocaleDateString(toIntlLocale(locale), { timeZone: TZ, ...options });
}

export function formatTime(date: Date, locale: Locale) {
  return date.toLocaleTimeString(toIntlLocale(locale), { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

// Kort ukedag ("man", "tue", ...) – erstatter hardkodede DAYS-arrays.
export function formatWeekday(date: Date, locale: Locale, style: "short" | "long" = "short") {
  return date.toLocaleDateString(toIntlLocale(locale), { timeZone: TZ, weekday: style });
}

// Kort måned ("jan", "feb", ...) – erstatter hardkodede MONTHS-arrays.
export function formatMonth(date: Date, locale: Locale, style: "short" | "long" = "short") {
  return date.toLocaleDateString(toIntlLocale(locale), { timeZone: TZ, month: style });
}

export function formatDateKey(date: Date) {
  // Returnerer "YYYY-MM-DD" i norsk tidssone. Rent teknisk nøkkelformat
  // (ikke visningstekst) – bevisst IKKE koblet til UI-språk.
  return date.toLocaleDateString("sv-SE", { timeZone: TZ });
}
