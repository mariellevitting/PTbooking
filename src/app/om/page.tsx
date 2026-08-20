import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Om Danceitude – utviklet sammen med dansemiljøet",
  description: "Danceitude ble laget fordi dansemiljøet fortjener bedre verktøy. Les historien bak appen.",
};

export default async function OmPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let backHref = "/login";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "trainer") backHref = "/trainer/dashboard";
    else if (profile?.role === "parent") backHref = "/parent/dashboard";
    else if (profile?.role === "dancer") backHref = "/dancer/dashboard";
  }

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
                Bli med nå!
              </Link>
            )}
          </div>
          <p className="text-[#e8c4f5] text-sm font-semibold uppercase tracking-widest mb-3">Evolution Danseklubb</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            Danceitude ble laget fordi dansemiljøet fortjener bedre verktøy
          </h1>
          <p className="text-[#f0d8fa] text-lg italic">Av dansere, for dansere</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-16">

        {/* Intro */}
        <section className="space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
          <p>Danceitude startet med et problem jeg selv kjente godt.</p>
          <p>Som danser i Evolution Danseklubb i Sarpsborg opplevde jeg hvor tungvint det kunne være å booke privattimer. Ledige timer ble delt i et Google Docs-dokument. Dansere og foreldre måtte finne et ledig tidspunkt, skrive seg inn og holde oversikt over bookingen selv.</p>
          <p>Det fungerte. Men det kunne fungere mye bedre.</p>
          <p>Jeg har en mastergrad med spesialisering i interaksjonsdesign, og jobber til daglig som Digital Marketing Manager og designer i SkyeTec, samt som Interaction Specialist i MyTalent. Jeg brenner for å utvikle digitale løsninger som tar utgangspunkt i menneskene som faktisk skal bruke dem.</p>
          <p>Derfor ønsket jeg ikke bare å lage en ny bookingløsning. Jeg ønsket å finne ut hva dansere, foreldre og trenere faktisk trenger.</p>
        </section>

        {/* AI og teknologi */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Fra Google Docs til App Store – med AI som utviklingspartner</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            <p>Det tekniske ble bygget end-to-end med AI som utviklingspartner ved hjelp av Claude Code. Ved å la AI håndtere arkitektur, kodegenerering og feilsøking kunne jeg holde fullt fokus på brukeropplevelsen og produktlogikken.</p>
          </div>
          <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Stacken under panseret</p>
            {[
              { name: "Next.js", desc: "Fullstack rammeverk med server-side rendering" },
              { name: "Supabase", desc: "Database, autentisering og row-level security" },
              { name: "Vercel", desc: "Kontinuerlig deployment med preview-miljøer" },
              { name: "Capacitor + Xcode", desc: "Native iOS-app fra samme kodebase" },
              { name: "Claude Code", desc: "AI-drevet utviklingsprosess gjennom hele prosjektet" },
            ].map(item => (
              <div key={item.name} className="flex items-start gap-3">
                <span className="text-[#E2A9F1] mt-0.5">•</span>
                <p className="text-gray-700 dark:text-gray-300 text-sm"><strong className="text-gray-900 dark:text-white">{item.name}</strong> – {item.desc}</p>
              </div>
            ))}
          </div>
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
                <div className="w-10 h-10 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 dark:bg-purple-900 flex items-center justify-center text-[#E2A9F1] dark:text-[#E2A9F1] font-bold">D</div>
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
                    <span className="text-[#E2A9F1] mt-0.5">•</span>{f}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 italic">Mindre tid på å holde oversikt. Mer tid til å trene, utvikle deg og nå målene dine.</p>
            </div>

            {/* Forelder */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 dark:bg-purple-900 flex items-center justify-center text-[#E2A9F1] dark:text-[#E2A9F1] font-bold">F</div>
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
                    <span className="text-[#E2A9F1] mt-0.5">•</span>{f}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 italic">En enklere måte å holde oversikt og følge opp dansehverdagen.</p>
            </div>

            {/* Trener */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 dark:bg-purple-900 flex items-center justify-center text-[#E2A9F1] dark:text-[#E2A9F1] font-bold">T</div>
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
                    <span className="text-[#E2A9F1] mt-0.5">•</span>{f}
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

          <div className="mt-12 bg-[#f5eeff] dark:bg-[#E2A9F1]/10 dark:bg-purple-950 rounded-2xl p-8 text-center">
            <p className="text-2xl font-bold text-[#c87de0] dark:text-[#E2A9F1] mb-1">Danceitude</p>
            <p className="text-[#E2A9F1] dark:text-[#E2A9F1] italic mb-6">Utviklet sammen med dansemiljøet. Laget for hele dansehverdagen.</p>
            {!user && (
              <Link href="/login" className="inline-block bg-[#3A3A3A] hover:bg-[#2a2a2a] text-[#E2A9F1] font-semibold px-8 py-3 rounded-xl transition-colors">
                Kom i gang
              </Link>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
