"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Noe gikk galt</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm">
        Kunne ikke laste siden. Dette kan skyldes en midlertidig feil på serveren.
      </p>
      <Button onClick={() => reset()} className="bg-[#3A3A3A] hover:bg-[#2a2a2a]">
        Prøv igjen
      </Button>
    </div>
  );
}
