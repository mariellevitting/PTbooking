export const metadata = {
  title: "Support – Danceitude",
  description: "Hjelp og støtte for Danceitude-appen.",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Support</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-10">Trenger du hjelp med Danceitude? Her finner du svar på vanlige spørsmål.</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Vanlige spørsmål</h2>
          <div className="space-y-4">
            {[
              { q: "Hvordan booker jeg en privattime?", a: "Gå til «Book time» fra dashbordet, velg trener, dato og tidspunkt, og bekreft bookingen." },
              { q: "Hvordan avbestiller jeg en time?", a: "Gå til «Mine timer» og trykk på timen du vil avbestille. Du finner avbestillingsknappen der." },
              { q: "Jeg har glemt passordet mitt – hva gjør jeg?", a: "Gå til innloggingssiden og trykk «Glemt passordet?». Du vil motta en e-post med en lenke for å tilbakestille passordet." },
              { q: "Hvordan sletter jeg kontoen min?", a: "Gå til Profil-siden og scroll ned til bunnen. Der finner du «Slett konto»-knappen. Kontoslettingen er permanent og kan ikke angres." },
              { q: "Jeg er trener – hvordan legger jeg ut ledige tider?", a: "Gå til «Legg ut tid» i menyen, velg dato og de tidspunktene du er tilgjengelig, og trykk «Legg ut timer»." },
            ].map(({ q, a }) => (
              <div key={q} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{q}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Kontakt oss</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Finner du ikke svaret du leter etter? Ta kontakt med oss på e-post:
          </p>
          <a href="mailto:miemarielle@live.no" className="text-[#c87de0] font-medium hover:underline">
            miemarielle@live.no
          </a>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Om appen</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Danceitude er en bookingapp for privattimer ved Evolution Danseklubb i Sarpsborg. Appen er utviklet av Mie Marielle Øverås Vitting som en del av masterarbeid i interaksjonsdesign.
          </p>
        </section>
      </div>
    </div>
  );
}
