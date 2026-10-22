"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ThemeSetting() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("danceitude_theme") === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("danceitude_theme", next ? "dark" : "light");
  }

  return (
    <Card>
      <CardContent className="pt-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {dark ? <Moon size={18} className="text-[#E2A9F1]" /> : <Sun size={18} className="text-[#E2A9F1]" />}
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Mørk modus</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Bytt mellom lys og mørk visning</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          role="switch"
          aria-checked={dark}
          aria-label="Mørk modus"
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
          style={{ background: dark ? "#E2A9F1" : "#d1d5db" }}
        >
          <span
            className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
            style={{ transform: dark ? "translateX(22px)" : "translateX(2px)" }}
          />
        </button>
      </CardContent>
    </Card>
  );
}
