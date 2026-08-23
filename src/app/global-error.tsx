"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="nb">
      <body className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center font-sans">
        <h1 className="text-2xl font-bold text-gray-900">Noe gikk galt</h1>
        <p className="text-gray-500 max-w-sm">
          Kunne ikke laste appen. Dette kan skyldes en midlertidig feil på serveren.
        </p>
        <button
          onClick={() => reset()}
          className="h-11 px-6 rounded-lg bg-[#3A3A3A] text-white font-medium hover:bg-[#2a2a2a]"
        >
          Prøv igjen
        </button>
      </body>
    </html>
  );
}
