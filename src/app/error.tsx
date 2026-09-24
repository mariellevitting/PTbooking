"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("heading")}</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm">
        {t("body")}
      </p>
      <Button onClick={() => reset()} className="bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white">
        {t("retry")}
      </Button>
    </div>
  );
}
