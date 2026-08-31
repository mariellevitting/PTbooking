import { Fragment, type ReactNode } from "react";

/**
 * Minimal tekst-formattering for klubb-konfig-felt lagret i databasen.
 * Støtter kun **fet skrift** – ingen annen markup.
 */
export function renderBold(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
