import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  const dataCollected = t.raw("dataCollected.items") as string[];
  const dataUse = t.raw("dataUse.items") as string[];

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-gray-800 dark:text-gray-100">
      <Link href="/login" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200 mb-4 -ml-2">
        <ArrowLeft size={24} strokeWidth={2.5} />
      </Link>
      <h1 className="text-3xl font-bold mb-2">{t("heading")}</h1>
      <p className="text-sm text-gray-500 mb-8">{t("lastUpdated")}</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{t("about.heading")}</h2>
        <p>{t("about.body")}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{t("dataCollected.heading")}</h2>
        <ul className="list-disc pl-5 space-y-1">
          {dataCollected.map(item => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{t("dataUse.heading")}</h2>
        <ul className="list-disc pl-5 space-y-1">
          {dataUse.map(item => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{t("sharing.heading")}</h2>
        <p>{t("sharing.body")}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{t("rights.heading")}</h2>
        <p>{t.rich("rights.body", { email: (chunks) => <a href="mailto:miemarielle@live.no" className="text-[#E2A9F1] underline">{chunks}</a> })}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">{t("contact.heading")}</h2>
        <p>{t("contact.name")}<br />{t("contact.emailLabel")} <a href="mailto:miemarielle@live.no" className="text-[#E2A9F1] underline">miemarielle@live.no</a></p>
      </section>
    </main>
  );
}
