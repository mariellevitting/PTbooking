import { COMPETITIONS } from "@/components/CompetitionList";

export interface ResultRow {
  competition_name: string;
  placement_freestyle: string | null;
  placement_slow: string | null;
}

function label(p: string) {
  if (p === "1") return "🥇 1. plass";
  if (p === "2") return "🥈 2. plass";
  if (p === "3") return "🥉 3. plass";
  return p;
}

export default function ResultsReadOnly({ results }: { results: ResultRow[] }) {
  if (results.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-500">Ingen resultater registrert</p>;
  return (
    <ul className="space-y-2">
      {results.map((r, i) => {
        const short = COMPETITIONS.find(c => c.name === r.competition_name)?.short ?? r.competition_name;
        return (
          <li key={i} className="text-sm">
            <p className="font-medium text-gray-800 dark:text-gray-100">{short}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {[r.placement_freestyle && `Freestyle: ${label(r.placement_freestyle)}`, r.placement_slow && `Slow: ${label(r.placement_slow)}`].filter(Boolean).join(" · ")}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
