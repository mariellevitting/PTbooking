import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Om Danceitude – utviklet sammen med dansemiljøet",
  description: "Danceitude ble laget fordi dansemiljøet fortjener bedre verktøy. Les historien bak appen.",
};

export default async function OmPage() {
  const t = await getTranslations("om");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let backHref = "/login";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "trainer") backHref = "/trainer/dashboard";
    else if (profile?.role === "parent") backHref = "/parent/dashboard";
    else if (profile?.role === "dancer") backHref = "/dancer/dashboard";
  }

  const roles = ["dancer", "parent", "trainer"] as const;
  const roleInitial: Record<(typeof roles)[number], string> = { dancer: "D", parent: "F", trainer: "T" };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Header */}
      <div className="bg-[#3A3A3A] text-[#E2A9F1]">
        <div className="max-w-3xl mx-auto px-6 pb-12 md:pb-20 page-safe-top">
          <div className="flex items-center justify-between mb-6">
            <Link href={backHref} className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            {!user && (
              <Link href="/login" className="bg-[#E2A9F1] text-[#3A3A3A] font-semibold text-sm px-5 py-2 rounded-xl hover:bg-[#d494e8] transition-colors">
                {t("backCta")}
              </Link>
            )}
          </div>
          <p className="text-[#e8c4f5] text-sm font-semibold uppercase tracking-widest mb-3">{t("eyebrow")}</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            {t("heroTitle")}
          </h1>
          <p className="text-[#f0d8fa] text-lg italic">{t("heroTagline")}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-16">

        {/* Intro */}
        <section className="space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
          <p>{t("intro.p1")}</p>
          <p>{t("intro.p2")}</p>
          <p>{t("intro.p3")}</p>
          <p>{t("intro.p4")}</p>
          <p>{t("intro.p5")}</p>
        </section>

        {/* Utviklet sammen */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t("developedTogether.heading")}</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            <p>{t("developedTogether.p1")}</p>
            <p>{t("developedTogether.p2")}</p>
            <p>{t("developedTogether.p3")}</p>
            <p className="font-medium text-gray-900 dark:text-white">{t("developedTogether.conclusion")}</p>
          </div>
        </section>

        {/* Tre roller */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t("threeRoles.heading")}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">{t("threeRoles.subheading")}</p>

          <div className="space-y-6">
            {roles.map(role => (
              <div key={role} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 dark:bg-purple-900 flex items-center justify-center text-[#E2A9F1] dark:text-[#E2A9F1] font-bold">{roleInitial[role]}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t(`threeRoles.${role}.title`)}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{t(`threeRoles.${role}.intro`)}</p>
                <ul className="space-y-2">
                  {(t.raw(`threeRoles.${role}.features`) as string[]).map(f => (
                    <li key={f} className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm">
                      <span className="text-[#E2A9F1] mt-0.5">•</span>{f}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 italic">{t(`threeRoles.${role}.footer`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mer enn booking */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t("moreThanBooking.heading")}</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            <p>{t("moreThanBooking.p1")}</p>
            <p>{t("moreThanBooking.p2")}</p>
            <p>{t("moreThanBooking.p3")}</p>
          </div>
        </section>

        {/* Avslutning */}
        <section className="border-t border-gray-200 dark:border-gray-700 pt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t("beginning.heading")}</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            <p>{t("beginning.p1")}</p>
            <p>{t("beginning.p2")}</p>
            <p className="font-medium text-gray-900 dark:text-white">{t("beginning.quote")}</p>
          </div>

          <div className="mt-12 bg-[#f5eeff] dark:bg-[#E2A9F1]/10 dark:bg-purple-950 rounded-2xl p-8 text-center">
            <p className="text-2xl font-bold text-[#c87de0] dark:text-[#E2A9F1] mb-1">Danceitude</p>
            <p className="text-[#E2A9F1] dark:text-[#E2A9F1] italic mb-6">{t("footerCard.tagline")}</p>
            {!user && (
              <Link href="/login" className="inline-block bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white text-[#E2A9F1] font-semibold px-8 py-3 rounded-xl transition-colors">
                {t("footerCard.cta")}
              </Link>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
