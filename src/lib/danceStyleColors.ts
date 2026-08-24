export const DANCE_STYLE_COLORS: Record<string, { bg: string; text: string; border: string; darkBg: string; darkText: string }> = {
  "Slow":             { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200",   darkBg: "dark:bg-blue-900/30",   darkText: "dark:text-blue-300" },
  "Freestyle":        { bg: "bg-pink-100",   text: "text-pink-700",   border: "border-pink-200",   darkBg: "dark:bg-pink-900/30",   darkText: "dark:text-pink-300" },
  "Jazz":             { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200", darkBg: "dark:bg-yellow-900/30", darkText: "dark:text-yellow-300" },
  "Moderne":          { bg: "bg-teal-100",   text: "text-teal-700",   border: "border-teal-200",   darkBg: "dark:bg-teal-900/30",   darkText: "dark:text-teal-300" },
  "Freestyle dobbel": { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", darkBg: "dark:bg-purple-900/30", darkText: "dark:text-purple-300" },
  "Slow dobbel":      { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", darkBg: "dark:bg-indigo-900/30", darkText: "dark:text-indigo-300" },
  "Akro":             { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", darkBg: "dark:bg-orange-900/30", darkText: "dark:text-orange-300" },
  "Hiphop":           { bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200",  darkBg: "dark:bg-green-900/30",  darkText: "dark:text-green-300" },
  "Show":             { bg: "bg-rose-100",   text: "text-rose-700",   border: "border-rose-200",   darkBg: "dark:bg-rose-900/30",   darkText: "dark:text-rose-300" },
};

export function styleColor(style: string) {
  return DANCE_STYLE_COLORS[style] ?? { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", darkBg: "dark:bg-gray-800", darkText: "dark:text-gray-300" };
}
