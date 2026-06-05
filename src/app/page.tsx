import Link from "next/link";
import { Button } from "@/components/ui/button";

const TRAINERS = [
  { name: "Sophie", styles: ["Freestyle", "Slow", "Jazz", "Moderne", "Freestyle dobbel", "Slow dobbel", "Akro"] },
  { name: "Lova", styles: ["Freestyle", "Slow", "Jazz", "Moderne", "Freestyle dobbel", "Slow dobbel", "Akro"] },
  { name: "Marielle", styles: ["Freestyle", "Slow", "Akro", "Freestyle dobbel", "Slow dobbel"] },
  { name: "Marthe", styles: ["Freestyle", "Slow", "Akro", "Freestyle dobbel", "Slow dobbel"] },
  { name: "Luna Kekstaite", styles: ["Freestyle", "Slow", "Jazz", "Moderne", "Freestyle dobbel", "Slow dobbel", "Akro"] },
  { name: "Cathrin Jørgensen", styles: ["Hiphop"] },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">PT Booking</h1>
          <p className="text-xs text-gray-400">Evolution Dance Studio</p>
        </div>
        <Link href="/login">
          <Button className="bg-purple-600 hover:bg-purple-700 text-sm">Logg inn</Button>
        </Link>
      </div>

      <div className="max-w-lg mx-auto p-6 space-y-6">
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <h2 className="text-xl font-bold">Bestille privattimer</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Evolutions instruktører tilbyr privattimer. Disse kan benyttes etter ønske;
            koreografi, teknikk, akrobatikk o.l. Dette er en flott mulighet for danserne
            til å utvikle seg, og få en tett oppfølging av trenerteamet.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            En privattime varer i 30 minutter og koster <strong>250,-</strong>, <strong>200,-</strong> eller{" "}
            <strong>150,-</strong> avhengig av trener. Kontakt først ønsket trener og avtal dato og
            tidspunkt for privattimen(e). Deretter starter du bestillingsrutinen og følger
            anvisningene nøye.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ VIKTIG!</p>
            <p className="text-sm text-amber-700">
              Kvitteringen du mottar på mail for betalt privattime må danseren ha med til privattimen!
              Du kan også ta et bilde av kvitteringen og sende til treneren i forkant av timen.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-6">
          <h3 className="font-semibold text-lg mb-4">Våre trenere</h3>
          <div className="space-y-1">
            {TRAINERS.map((t) => (
              <div key={t.name} className="flex items-start gap-3 py-3 border-b last:border-0">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0 text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.styles.join(" · ")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Link href="/register">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">Registrer deg</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="w-full">Logg inn</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
