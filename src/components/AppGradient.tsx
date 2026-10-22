"use client";

import { usePathname } from "next/navigation";

// Toningen vises bare på sidene man når fra menyen.
const MENU_PAGES = [
  "/trainer/dashboard", "/trainer/availability", "/trainer/book-for-dancer", "/trainer/historikk",
  "/trainer/sesongmal", "/trainer/konkurranser", "/trainer/profil", "/admin",
  "/dancer/dashboard", "/dancer/profil",
  "/parent/dashboard", "/parent/profil",
];

export default function AppGradient() {
  const pathname = usePathname() ?? "";
  if (!MENU_PAGES.includes(pathname.replace(/\/$/, ""))) return null;
  return <div className="home-gradient" />;
}
