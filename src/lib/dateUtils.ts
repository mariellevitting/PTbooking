const TZ = "Europe/Oslo";

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}) {
  return date.toLocaleDateString("nb-NO", { timeZone: TZ, ...options });
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString("nb-NO", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

export function formatDateKey(date: Date) {
  // Returnerer "YYYY-MM-DD" i norsk tidssone
  return date.toLocaleDateString("sv-SE", { timeZone: TZ });
}
