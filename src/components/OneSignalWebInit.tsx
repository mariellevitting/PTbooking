"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const ONESIGNAL_APP_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? "b9607f9e-6dbe-49b0-8bcc-edf5f6728575";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(os: any) => void | Promise<void>>;
  }
}

// Web-push via OneSignal for nettleser (særlig Android Chrome).
// Den native iOS-appen bruker Capacitor-pluginen (se OneSignalInit) — da hopper vi over her.
export default function OneSignalWebInit() {
  useEffect(() => {
    const isCapacitor = typeof window !== "undefined" && !!(window as any).Capacitor;
    if (isCapacitor) return;

    const supported =
      typeof window !== "undefined" &&
      window.isSecureContext &&
      "serviceWorker" in navigator &&
      "Notification" in window &&
      "PushManager" in window;
    if (!supported) return;

    // Unngå dobbel-lasting ved client-navigasjon
    if (document.getElementById("onesignal-sdk")) return;

    const script = document.createElement("script");
    script.id = "onesignal-sdk";
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    document.head.appendChild(script);

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          serviceWorkerPath: "/OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: "/" },
          allowLocalhostAsSecureOrigin: true,
        });

        // Koble Supabase bruker-ID til OneSignal (samme external_id som native),
        // slik at /api/notify treffer både web og mobil.
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await OneSignal.login(user.id);
        }

        // Be om tillatelse hvis brukeren ikke har svart ennå.
        // OneSignal begrenser selv hvor ofte dette vises.
        if (typeof Notification !== "undefined" && Notification.permission === "default") {
          await OneSignal.Slidedown.promptPush();
        }
      } catch {
        // Ikke støttet / blokkert — ignorer
      }
    });
  }, []);

  return null;
}
