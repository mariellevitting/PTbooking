// Tidsbasert hilsen i norsk tid (Oslo). Vercel kjører i UTC.
// Returnerer en nøkkel (ikke selve teksten) – selve ordlyden ligger i
// src/messages/{no,en}.json under "common.greeting", slik at den lokaliseres
// riktig. Bruk: t(`greeting.${greetingKey()}`) med useTranslations("common").
export type GreetingKey = "morning" | "midday" | "afternoon" | "evening";

export function greetingKey(now: Date = new Date()): GreetingKey {
  const h =
    parseInt(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Oslo",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(now),
      10
    ) % 24;

  if (h < 10) return "morning";
  if (h < 12) return "midday";
  if (h < 18) return "afternoon";
  return "evening";
}
