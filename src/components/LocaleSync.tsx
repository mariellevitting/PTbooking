"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LOCALE_COOKIE, localeFromAcceptLanguage, type Locale } from "@/i18n/locale";

const SYNCED_FLAG = "danceitude-locale-synced";

// Skriver enhetens/nettleserens språk til profiles.language (language_source='auto')
// FØRSTE gang en innlogget bruker ikke har noe lagret språk ennå. Rører aldri en bruker
// som allerede har valgt manuelt eller blitt auto-registrert – se docs/DECISIONS.md.
export default function LocaleSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(SYNCED_FLAG) === "1") return;

    async function sync() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("language")
          .eq("id", user.id)
          .single();

        if (profile?.language) {
          localStorage.setItem(SYNCED_FLAG, "1");
          return;
        }

        const detected: Locale = localeFromAcceptLanguage(navigator.language);
        await supabase
          .from("profiles")
          .update({ language: detected, language_source: "auto" })
          .eq("id", user.id);
        document.cookie = `${LOCALE_COOKIE}=${detected}; path=/; max-age=${60 * 60 * 24 * 365}`;
        localStorage.setItem(SYNCED_FLAG, "1");
      } catch {
        // Ikke kritisk – prøver igjen neste sesjon
      }
    }

    sync();
  }, []);

  return null;
}
