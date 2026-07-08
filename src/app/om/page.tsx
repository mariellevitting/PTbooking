import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Om Danceitude – utviklet sammen med dansemiljøet",
  description: "Danceitude ble laget fordi dansemiljøet fortjener bedre verktøy. Les historien bak appen.",
};

export default async function OmPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Header */}
      <div className="bg-purple-600 text-white">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
          <Link href="/login" className="text-purple-200 hover:text-white text-sm mb-6 inline-block">← Tilbake</Link>
          <p className="text-purple-200 text-sm font-semibold uppercase tracking-widest mb-3">Evolution Danseklubb</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            Danceitude ble laget fordi dansemiljøet fortjener bedre verktøy
          </h1>
          <p className="text-purple-100 text-lg italic">Av dansere, for dansere</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-16">

        {/* Intro */}
        <section className="space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
          <p>Danceitude startet med et problem jeg selv kjente godt.</p>
          <p>Som danser i Evolution Danseklubb i Sarpsborg opplevde jeg hvor tungvint det kunne være å booke privattimer. Ledige timer ble delt i et Google Docs-dokument. Dansere og foreldre måtte finne et ledig tidspunkt, skrive seg inn og holde oversikt over bookingen selv.</p>
          <p>Det fungerte. Men det kunne fungere mye bedre.</p>
          <p>Jeg har en mastergrad med spesialisering i interaksjonsdesign, og brenner for å utvikle digitale løsninger som tar utgangspunkt i menneskene som faktisk skal bruke dem.</p>
          <p>Derfor ønsket jeg ikke bare å lage en ny bookingløsning. Jeg ønsket å finne ut hva dansere, foreldre og trenere faktisk trenger.</p>
        </section>

        {/* Utviklet sammen */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Utviklet sammen med dansemiljøet</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            <p>Danceitude startet som en del av masterarbeidet mitt og ble utviklet gjennom en brukersentrert designprosess.</p>
            <p>Gjennom workshops med dansere, foreldre og trenere kartla vi utfordringene med dagens løsning. Deltakerne fikk dele erfaringer, diskutere behov og selv skissere hvordan de ønsket at en bedre løsning skulle fungere.</p>
            <p>Ideene ble deretter utviklet til prototyper, testet med brukere og forbedret basert på tilbakemeldingene vi fikk.</p>
            <p className="font-medium text-gray-900 dark:text-white">Danceitude er derfor ikke bygget på antakelser om hva dansemiljøet trenger. Den er utviklet sammen med menneskene som kjenner hverdagen best.</p>
          </div>
        </section>

        {/* Tre roller */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Én app. Tre roller. En enklere dansehverdag.</h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">Danceitude samler booking, trening, utvikling og konkurranser på ett sted. Hver bruker får funksjoner og oversikt tilpasset sin rolle.</p>

          <div className="space-y-6">
            {/* Danser */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold">D</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">For dansere</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Finn trenere, book privattimer og få bedre oversikt over treningen og utviklingen din.</p>
              <ul className="space-y-2">
                {[
                  "Bla gjennom tilgjengelige trenere og danseformer",
                  "Book privattimer med få trykk",
                  "Se kommende og gjennomførte timer",
                  "Avbestill timer direkte i appen",
                  "Logg freestyle- og slow-poeng",
                  "Følg fremgangen din mot neste nivå – fra Rekrutt til Elite",
                  "Sett personlige mål for sesongen",
                  "Logg og samle konkurranseresultater",
                  "Se nedtelling til neste konkurranse",
                  "Motta varsler når en trener booker en time på dine vegne",
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="text-purple-500 mt-0.5">•</span>{f}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 italic">Mindre tid på å holde oversikt. Mer tid til å trene, utvikle deg og nå målene dine.</p>
            </div>

            {/* Forelder */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold">F</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">For foreldre</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Følg opp barnets dansehverdag uten å måtte lete gjennom dokumenter, meldinger og ulike systemer.</p>
              <ul className="space-y-2">
                {[
                  "Book privattimer på vegne av barnet",
                  "Se kommende og gjennomførte timer",
                  "Ha oversikt over barnets bookinger på ett sted",
                  "Avbestill timer direkte i appen",
                  "Motta varsler når en trener booker en time på barnets vegne",
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="text-purple-500 mt-0.5">•</span>{f}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 italic">En enklere måte å holde oversikt og følge opp dansehverdagen.</p>
            </div>

            {/* Trener */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold">T</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">For trenere</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Bruk mindre tid på administrasjon og få bedre oversikt over tilgjengelighet, bookinger og danserne du følger opp.</p>
              <ul className="space-y-2">
                {[
                  "Legg ut ledige tider for enkeltdager eller flere dager samtidig",
                  "Se kommende og gjennomførte bookinger i én samlet oversikt",
                  "Book timer direkte for dansere og koble timen til danserens profil",
                  "Søk opp dansere og se historikk og antall gjennomførte timer",
                  "Book dobbelttimer og koble timen til to danserprofiler",
                  "Avbestill timer direkte i appen",
                  "Logg konkurranseresultater",
                  "Motta varsler ved nye bookinger",
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm">
                    <span className="text-purple-500 mt-0.5">•</span>{f}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 italic">Mindre tid på meldinger, dokumenter og koordinering. Bedre oversikt over danserne du trener.</p>
            </div>
          </div>
        </section>

        {/* Mer enn booking */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Mer enn en bookingapp</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            <p>Danceitude startet med et behov for en enklere måte å booke privattimer på.</p>
            <p>Men gjennom arbeidet med dansere, foreldre og trenere ble det tydelig at behovet var større. Dansehverdagen består av treninger, mål, nivåer, konkurranser, resultater og utvikling over tid. Mye av denne informasjonen er i dag spredt mellom dokumenter, meldinger, notater og ulike systemer.</p>
            <p>Danceitude samler dette på ett sted. Målet er å gjøre det enklere å organisere dansehverdagen, følge utvikling over tid og skape bedre samhandling mellom dansere, foreldre og trenere.</p>
          </div>
        </section>

        {/* Avslutning */}
        <section className="border-t border-gray-200 dark:border-gray-700 pt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Dette er bare begynnelsen</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            <p>Danceitude skal fortsette å utvikles sammen med dansemiljøet.</p>
            <p>Tilbakemeldinger fra dansere, foreldre og trenere vil fortsatt være en viktig del av hvordan appen forbedres og hvilke funksjoner som utvikles videre.</p>
            <p className="font-medium text-gray-900 dark:text-white">For de beste løsningene blir ikke laget for brukerne. De blir laget sammen med dem.</p>
          </div>

          <div className="mt-12 bg-purple-50 dark:bg-purple-950 rounded-2xl p-8 text-center">
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-1">Danceitude</p>
            <p className="text-purple-500 dark:text-purple-400 italic mb-6">Utviklet sammen med dansemiljøet. Laget for hele dansehverdagen.</p>
            {!user && (
              <Link href="/login" className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
                Kom i gang
              </Link>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
