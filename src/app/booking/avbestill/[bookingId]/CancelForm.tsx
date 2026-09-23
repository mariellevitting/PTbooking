"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/dateUtils";
import type { Locale } from "@/i18n/locale";

interface Props {
  bookingId: string;
  slotId: string;
  trainerId: string;
  dancerName: string;
  danceStyle: string;
  startAt: string;
  withinDeadline: boolean;
  dashboardUrl: string;
}

export default function CancelForm({ bookingId, slotId, trainerId, dancerName, danceStyle, startAt, withinDeadline, dashboardUrl }: Props) {
  const t = useTranslations("cancelForm");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const start = new Date(startAt);
  const tidspunkt = formatDate(start, locale, { weekday: "long", day: "numeric", month: "long" }) +
    " " + formatTime(start, locale);

  async function handleCancel() {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error: cancelError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (cancelError) {
      setError(t("genericError"));
      setLoading(false);
      return;
    }

    const { error: slotError } = await supabase
      .from("availability_slots")
      .update({ is_booked: false })
      .eq("id", slotId);

    if (slotError) {
      console.error("Slot update failed:", slotError);
    }

    const cancelMessage = t("notifyTrainerCancelled", { dancerName, style: danceStyle, when: tidspunkt });
    await supabase.from("notifications").insert({
      user_id: trainerId,
      message: cancelMessage,
    });

    // Send push-varsel til trener
    fetch("/api/notify-trainer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainerId, message: cancelMessage }),
    }).catch(() => {});

    router.push(dashboardUrl);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{t("lessonToCancel")}</p>
        <p className="font-semibold">{tidspunkt}</p>
        <p className="text-sm text-[#E2A9F1]">{dancerName} · {danceStyle}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-sm text-amber-700">{t("trainerNotified")}</p>
      </div>

      {withinDeadline && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-1">{t("lateCancelTitle")}</p>
          <p className="text-sm text-red-600">
            {t("lateCancelBody")}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-[#3A3A3A] w-4 h-4"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {withinDeadline ? t("confirmLate") : t("confirmNormal")}
          </span>
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        className="w-full bg-red-500 hover:bg-red-600 text-white"
        onClick={handleCancel}
        disabled={!confirmed || loading}
      >
        {loading ? t("cancelling") : t("cancelButton")}
      </Button>

      <button
        type="button"
        onClick={() => router.back()}
        className="w-full text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 py-2"
      >
        {t("goBack")}
      </button>
    </div>
  );
}
