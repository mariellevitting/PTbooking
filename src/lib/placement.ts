// Plassering lagres som tekst: "1"–"3" (finale/pall), "finalist:N" (4–8),
// "semifinale", "kvartfinale", "second try". Eldre fritekst vises som den er.

export type Round = "finale" | "finalist" | "semifinale" | "kvartfinale" | "second try";

export const ROUNDS: { key: Round; label: string }[] = [
  { key: "finale", label: "Finale" },
  { key: "finalist", label: "Finalist" },
  { key: "semifinale", label: "Semifinale" },
  { key: "kvartfinale", label: "Kvartfinale" },
  { key: "second try", label: "Second try" },
];

export const FINALE_PLACES = [1, 2, 3];
export const FINALIST_PLACES = [4, 5, 6, 7, 8];

export function roundOf(p: string | null): Round | null {
  if (!p) return null;
  if (["1", "2", "3"].includes(p)) return "finale";
  if (p.startsWith("finalist:")) return "finalist";
  if (p === "semifinale" || p === "kvartfinale" || p === "second try") return p;
  return null;
}

export function formatPlacement(p: string | null): string | null {
  if (!p) return null;
  if (p === "1") return "🥇 1. plass";
  if (p === "2") return "🥈 2. plass";
  if (p === "3") return "🥉 3. plass";
  if (p.startsWith("finalist:")) return `Finalist · ${p.slice(9)}. plass`;
  if (p === "semifinale") return "Semifinale";
  if (p === "kvartfinale") return "Kvartfinale";
  if (p === "second try") return "Second try";
  return p;
}
