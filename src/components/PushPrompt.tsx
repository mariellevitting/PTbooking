"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";

const DISMISS_KEY = "danceitude_push_prompt_dismissed_at";
const DISMISS_DAYS = 14;

type State = "hidden" | "ask" | "blocked";

async function getNativeOneSignal() {
  const mod = await import("@onesignal/capacitor-plugin");
  return (mod as any).OneSignal ?? (mod as any).default ?? mod;
}

function isCapacitor() {
  return typeof window !== "undefined" && !!(window as any).Capacitor;
}

// Vises på forsiden kun for brukere som ikke har push-varsler på.
export default function PushPrompt({ text }: { text?: string }) {
  const [state, setState] = useState<State>("hidden");

  useEffect(() => {
    try {
      const dismissed = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
      if (dismissed && Date.now() - dismissed < DISMISS_DAYS * 86400000) return;
    } catch {}

    async function check() {
      if (isCapacitor()) {
        try {
          const OneSignal = await getNativeOneSignal();
          const has = await OneSignal.Notifications.hasPermission();
          if (!has) setState("ask");
        } catch {}
        return;
      }
      const supported = window.isSecureContext && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
      if (!supported) return;
      if (Notification.permission === "default") setState("ask");
      else if (Notification.permission === "denied") setState("blocked");
    }
    check();
  }, []);

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setState("hidden");
  }

  async function enable() {
    if (isCapacitor()) {
      try {
        const OneSignal = await getNativeOneSignal();
        // true = åpner iPhone-innstillingene hvis brukeren har sagt nei tidligere
        const granted = await OneSignal.Notifications.requestPermission(true);
        if (granted) setState("hidden");
      } catch {}
      return;
    }
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        await OneSignal.Notifications.requestPermission();
      } catch {}
      if (Notification.permission === "granted") setState("hidden");
      else if (Notification.permission === "denied") setState("blocked");
    });
  }

  if (state === "hidden") return null;

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-[#E2A9F1]/60 p-4 mt-4">
      <button type="button" onClick={dismiss} aria-label="Ikke nå" className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
        <X size={16} />
      </button>
      <div className="flex items-start gap-3 pr-5">
        <div className="w-9 h-9 rounded-full bg-[#f5eeff] dark:bg-[#E2A9F1]/15 flex items-center justify-center shrink-0">
          <BellRing size={18} className="text-[#c87de0]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Skru på varsler</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {state === "blocked"
              ? "Varsler er blokkert i nettleseren. Skru dem på i nettleserens innstillinger for denne siden."
              : text ?? "Få beskjed om nye ledige tider, påminnelser om timene dine, bytteforespørsler og meldinger fra klubben."}
          </p>
          {state === "ask" && (
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={enable} className="text-sm font-medium px-3 py-1.5 rounded-lg bg-[#3A3A3A] text-[#E2A9F1] dark:bg-[#c87de0] dark:text-white">
                Skru på varsler
              </button>
              <button type="button" onClick={dismiss} className="text-sm px-3 py-1.5 text-gray-500 dark:text-gray-400">
                Ikke nå
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
