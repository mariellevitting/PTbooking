"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createAuthClient } from "@/lib/supabase/authClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GlemtPassordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createAuthClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://app.danceitude.no/nytt-passord`,
    });

    if (error) {
      setError(t("forgotPassword.genericError"));
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 relative bg-[#3A3A3A]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-800" />
        <div className="relative z-10 flex flex-col justify-end p-10 text-white">
          <p className="text-white/90 text-lg italic mb-3">✦ {t("hero.tagline")}</p>
          <h1 className="text-4xl font-bold mb-2">Danceitude</h1>
          <p className="text-white/80 text-lg">{t("hero.subtitle")}</p>
        </div>
      </div>

      <div className="md:hidden h-48 relative bg-gradient-to-br from-purple-500 to-purple-800">
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <p className="text-white/90 text-sm italic mb-1">✦ {t("hero.tagline")}</p>
          <h1 className="text-2xl font-bold text-white">Danceitude</h1>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950 p-8">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#edd5f9] dark:bg-[#E2A9F1]/15 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">📧</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t("forgotPassword.sentHeading")}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t.rich("forgotPassword.sentBody", { email, b: (chunks) => <strong>{chunks}</strong> })}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t("forgotPassword.spamHint")}
              </p>
              <Link href="/login" className="text-[#E2A9F1] hover:underline text-sm block">
                {t("forgotPassword.backToLogin")}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t("forgotPassword.heading")}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t("forgotPassword.subheading")}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("forgotPassword.email")}</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("forgotPassword.emailPlaceholder")}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white h-11 text-base" disabled={loading}>
                  {loading ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                <Link href="/login" className="text-[#E2A9F1] hover:underline">
                  {t("forgotPassword.backToLogin")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
