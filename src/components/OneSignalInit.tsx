"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? "b9607f9e-6dbe-49b0-8bcc-edf5f6728575";

export default function OneSignalInit() {
  useEffect(() => {
    async function init() {
      try {
        const mod = await import("@onesignal/capacitor-plugin");
        const OneSignal = (mod as any).OneSignal ?? mod.default ?? mod;
        await OneSignal.initialize(ONESIGNAL_APP_ID);
        (OneSignal as any).setAppGroupIdentifier?.("group.no.danceitude.app.onesignal");
        await OneSignal.Notifications.requestPermission(true);

        // Koble Supabase bruker-ID til OneSignal så vi kan sende push til spesifikke brukere
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await OneSignal.login(user.id);
        }
      } catch {
        // Ikke Capacitor-miljø (web) — ignorer
      }
    }

    init();
  }, []);

  return null;
}
