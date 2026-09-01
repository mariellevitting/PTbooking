import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-gray-800 dark:text-gray-100">
      <Link href="/login" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200 mb-4 -ml-2">
        <ArrowLeft size={24} strokeWidth={2.5} />
      </Link>
      <h1 className="text-3xl font-bold mb-2">Personvernerklæring</h1>
      <p className="text-sm text-gray-500 mb-8">Sist oppdatert: august 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Om appen</h2>
        <p>Danceitude er en bookingapp for privattimer for danseklubber. Appen er utviklet og driftes av Mie Marielle Øverås Vitting.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Hvilke data samler vi inn?</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Navn og e-postadresse (ved registrering)</li>
          <li>Rolle (danser, forelder eller trener)</li>
          <li>Bookinghistorikk og timeavtaler</li>
          <li>Treningsresultater og mål (hvis du legger dem inn selv)</li>
          <li>Konkurranseresultater (hvis du legger dem inn selv)</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Hvordan brukes dataene?</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>For å vise og administrere bookinger</li>
          <li>For å sende varsler om kommende timer</li>
          <li>For å vise trenere og dansere relevant informasjon</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Deling av data</h2>
        <p>Vi deler ikke personopplysninger med tredjeparter. Data lagres sikkert hos Supabase.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Dine rettigheter</h2>
        <p>Du kan når som helst be om innsyn i, retting av eller sletting av dine personopplysninger ved å kontakte oss på <a href="mailto:miemarielle@live.no" className="text-[#E2A9F1] underline">miemarielle@live.no</a>.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Kontakt</h2>
        <p>Mie Marielle Øverås Vitting<br />E-post: <a href="mailto:miemarielle@live.no" className="text-[#E2A9F1] underline">miemarielle@live.no</a></p>
      </section>
    </main>
  );
}
