"use client";

import { useEffect } from "react";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? "b9607f9e-6dbe-49b0-8bcc-edf5f6728575";

export default function OneSignalInit() {
  useEffect(() => {
    if (!ONESIGNAL_APP_ID) return;

    async function init() {
      try {
        const { OneSignal } = await import("@onesignal/capacitor-plugin");
        await OneSignal.initialize(ONESIGNAL_APP_ID, {
          iOSSettings: {
            kOSSettingsKeyInAppLaunchURL: false,
          },
        } as any);
        // App Group for Notification Service Extension
        (OneSignal as any).setAppGroupIdentifier?.("group.no.danceitude.app.onesignal");
        await OneSignal.Notifications.requestPermission(true);
      } catch {
        // Ikke Capacitor-miljø (web) — ignorer
      }
    }

    init();
  }, []);

  return null;
}
