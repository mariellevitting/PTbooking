// Tidsbasert hilsen i norsk tid (Oslo). Vercel kjører i UTC.
export function greeting(now: Date = new Date()): string {
  const h =
    parseInt(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Oslo",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(now),
      10
    ) % 24;

  if (h < 10) return "God morgen";
  if (h < 12) return "God formiddag";
  if (h < 18) return "God ettermiddag";
  return "God kveld";
}
