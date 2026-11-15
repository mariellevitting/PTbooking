// Plassering lagres som tekst: "1"–"9" (finale), "finalist:N" (4–8, eldre
// data fra da finale/finalist var separate runder), "semifinale",
// "kvartfinale", "second try". Eldre fritekst vises som den er.

export type Round = "finale" | "semifinale" | "kvartfinale" | "second try";

export const ROUNDS: { key: Round; label: string }[] = [
  { key: "finale", label: "Finale" },
  { key: "semifinale", label: "Semifinale" },
  { key: "kvartfinale", label: "Kvartfinale" },
  { key: "second try", label: "Second try" },
];

export const FINALE_PLACES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function roundOf(p: string | null): Round | null {
  if (!p) return null;
  if (FINALE_PLACES.some(n => String(n) === p) || p.startsWith("finalist:")) return "finale";
  if (p === "semifinale" || p === "kvartfinale" || p === "second try") return p;
  return null;
}

export function formatPlacement(p: string | null): string | null {
  if (!p) return null;
  if (p === "1") return "🥇 1. plass";
  if (p === "2") return "🥈 2. plass";
  if (p === "3") return "🥉 3. plass";
  if (FINALE_PLACES.some(n => String(n) === p)) return `${p}. plass`;
  if (p.startsWith("finalist:")) return `${p.slice(9)}. plass`;
  if (p === "semifinale") return "Semifinale";
  if (p === "kvartfinale") return "Kvartfinale";
  if (p === "second try") return "Second try";
  return p;
}
