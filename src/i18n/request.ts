import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE, isLocale, localeFromAcceptLanguage, type Locale } from "./locale";

export default getRequestConfig(async () => {
  const locale = await resolveRequestLocale();
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});

/**
 * Rekkefølge (se docs/DECISIONS.md):
 * 1. Innlogget bruker med lagret `profiles.language` – vinner alltid, også på ny enhet.
 * 2. NEXT_LOCALE-cookie (satt av proxy.ts fra Accept-Language, eller av språkvelgeren).
 * 3. Accept-Language direkte, som siste utvei.
 */
async function resolveRequestLocale(): Promise<Locale> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", user.id)
        .single();
      if (isLocale(profile?.language)) return profile.language;
    }
  } catch {
    // Ikke tilgjengelig (f.eks. under bygging) – fall gjennom til cookie/header.
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const headerStore = await headers();
  return localeFromAcceptLanguage(headerStore.get("accept-language"));
}
