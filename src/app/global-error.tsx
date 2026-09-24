"use client";

// Denne komponenten erstatter hele rot-layouten ved en fatal feil og har derfor
// ikke tilgang til NextIntlClientProvider. Bruker navigator.language direkte
// som et minimalt, selvstendig fallback-oppslag – kun for dette ene skjermbildet.
const TEXT = {
  no: { heading: "Noe gikk galt", body: "Kunne ikke laste appen. Dette kan skyldes en midlertidig feil på serveren.", retry: "Prøv igjen" },
  en: { heading: "Something went wrong", body: "Could not load the app. This may be a temporary server error.", retry: "Try again" },
};

function useFallbackText() {
  const isNorwegian = typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("nb")
    || typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("no");
  return isNorwegian ? TEXT.no : TEXT.en;
}

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useFallbackText();
  return (
    <html lang={t === TEXT.no ? "nb" : "en"}>
      <body className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center font-sans">
        <h1 className="text-2xl font-bold text-gray-900">{t.heading}</h1>
        <p className="text-gray-500 max-w-sm">
          {t.body}
        </p>
        <button
          onClick={() => reset()}
          className="h-11 px-6 rounded-lg bg-[#3A3A3A] text-white font-medium hover:bg-[#2a2a2a]"
        >
          {t.retry}
        </button>
      </body>
    </html>
  );
}
