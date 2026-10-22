import type { GoalValues } from "@/components/GoalsTabs";

const GROUPS: { key: keyof GoalValues; label: string }[] = [
  { key: "season", label: "Sesong" },
  { key: "freestyle", label: "Freestyle" },
  { key: "slow", label: "Slow" },
];

function parse(v: string | null | undefined) {
  return (v ?? "").split("\n").map(g => g.trim()).filter(g => g !== "");
}

export function hasAnyGoals(v: Partial<Record<keyof GoalValues, string | null>>) {
  return GROUPS.some(g => parse(v[g.key]).length > 0);
}

export default function GoalsReadOnly({ values, emptyText = "Ingen mål delt ennå" }: { values: Partial<Record<keyof GoalValues, string | null>>; emptyText?: string }) {
  const groups = GROUPS.map(g => ({ ...g, goals: parse(values[g.key]) })).filter(g => g.goals.length > 0);
  if (groups.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-500">{emptyText}</p>;
  return (
    <div className="space-y-4">
      {groups.map(g => (
        <div key={g.key}>
          <p className="text-xs font-semibold text-[#c87de0] uppercase tracking-wide mb-1.5">{g.label}</p>
          <ul className="space-y-1.5">
            {g.goals.map((goal, i) => {
              const done = goal.startsWith("[x] ");
              return (
                <li key={i} className="flex items-center justify-between gap-2 text-sm py-0.5">
                  <span className={`flex items-start gap-2 ${done ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-700 dark:text-gray-300"}`}>
                    <span className="text-[#c87de0] mt-0.5 no-underline">•</span>
                    {done ? goal.slice(4) : goal}
                  </span>
                  {done && <span className="text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">Mål nådd</span>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
