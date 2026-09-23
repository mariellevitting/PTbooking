import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Support – Danceitude",
  description: "Hjelp og støtte for Danceitude-appen.",
};

export default async function SupportPage() {
  const t = await getTranslations("support");
  const faq = t.raw("faq") as { q: string; a: string }[];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 px-6 py-12 max-w-2xl mx-auto">
      <Link href="/login" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200 mb-4 -ml-2">
        <ArrowLeft size={24} strokeWidth={2.5} />
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t("heading")}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-10">{t("subheading")}</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t("faqHeading")}</h2>
          <div className="space-y-4">
            {faq.map(({ q, a }) => (
              <div key={q} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{q}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t("contactHeading")}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {t("contactBody")}
          </p>
          <a href="mailto:miemarielle@live.no" className="text-[#c87de0] font-medium hover:underline">
            miemarielle@live.no
          </a>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t("aboutHeading")}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t("aboutBody")}
          </p>
        </section>
      </div>
    </div>
  );
}
