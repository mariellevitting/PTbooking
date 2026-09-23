"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { LOCALE_COOKIE, LOCALES, type Locale } from "@/i18n/locale";
import { Languages } from "lucide-react";

export default function LanguageSwitcher({ userId, current }: { userId: string; current: Locale | null }) {
  const t = useTranslations("language");
  const [saving, setSaving] = useState<Locale | null>(null);

  async function choose(locale: Locale) {
    if (saving || locale === current) return;
    setSaving(locale);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ language: locale, language_source: "manual" })
      .eq("id", userId);
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  }

  return (
    <div className="border dark:border-gray-700 rounded-2xl p-4 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2 mb-3">
        <Languages size={18} className="text-[#c87de0]" />
        <p className="font-semibold text-gray-900 dark:text-white">{t("label")}</p>
      </div>
      <div className="flex gap-2">
        {LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => choose(locale)}
            disabled={saving !== null}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
              current === locale
                ? "bg-[#3A3A3A] text-white dark:bg-[#c87de0]"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {saving === locale ? "…" : t(locale)}
          </button>
        ))}
      </div>
    </div>
  );
}
