"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Clock, UserCircle, Trophy, History, PlusCircle, Menu, X, LayoutDashboard, Target } from "lucide-react";
import { useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import FeedbackButton from "@/components/FeedbackButton";

const NAV = [
  { href: "/trainer/dashboard", label: "Mine timer", icon: Calendar },
  { href: "/trainer/availability", label: "Legg ut tid", icon: PlusCircle },
  { href: "/trainer/book-for-dancer", label: "Book for danser", icon: Clock },
  { href: "/trainer/historikk", label: "Historikk", icon: History },
  { href: "/trainer/sesongmal", label: "Sesongmål", icon: Target },
  { href: "/trainer/konkurranser", label: "Konkurranser", icon: Trophy },
  { href: "/trainer/profil", label: "Profil", icon: UserCircle },
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
];

interface Props {
  name: string;
  userId: string;
  email: string;
  avatarUrl: string | null;
  notifications: any[];
}

export default function TrainerSidebar({ name, userId, email, avatarUrl, notifications }: Props) {
  const isAdmin = email === "miemarielle@live.no";
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = name.split(" ")[0];

  function isActive(href: string) {
    if (href === "/trainer/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <FeedbackButton userId={userId} userName={name} role="trainer" />
      {/* Mobil: lilla topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#3A3A3A] dark:bg-[#4a4a4a] px-4 pb-1.5 pt-[calc(0.5rem+env(safe-area-inset-top))] flex items-center justify-between shadow-md">
        <button onClick={() => setMenuOpen(true)} className="p-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors">
          <Menu size={24} className="text-[#E2A9F1]" />
        </button>
        <p className="text-[#E2A9F1] font-semibold text-sm">Danceitude</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 [&_button]:text-[#E2A9F1] [&_svg]:text-[#E2A9F1] [&_span]:bg-[#E2A9F1] [&_span]:text-[#3A3A3A]">
            <ThemeToggle />
            <NotificationBell notifications={notifications} />
          </div>
          <Link href="/trainer/profil" className="hover:opacity-80 transition-opacity">
            {avatarUrl
              ? <img src={avatarUrl} alt="Profil" className="w-8 h-8 rounded-full object-cover border-2 border-[#E2A9F1]" />
              : <div className="w-8 h-8 rounded-full bg-[#E2A9F1] flex items-center justify-center text-white font-bold text-sm">{firstName.charAt(0)}</div>
            }
          </Link>
        </div>
      </div>

      {/* Mobil: slide-in drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
            <div className="flex justify-end p-4">
              <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            {/* Profil */}
            <Link href="/trainer/profil" onClick={() => setMenuOpen(false)} className="px-6 pb-6 flex items-center gap-4 border-b hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors">
              <div className="w-14 h-14 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl
                  ? <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-[#E2A9F1]">{firstName.charAt(0)}</span>}
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-100">{name}</p>
                <p className="text-xs text-[#E2A9F1]">Se profil →</p>
              </div>
            </Link>
            {/* Menyvalg */}
            <div className="flex-1 py-4 overflow-y-auto">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`w-full flex items-center gap-4 px-6 py-3.5 text-sm font-medium transition-colors ${active ? "bg-[#f5eeff] dark:bg-[#E2A9F1]/10 text-[#c87de0] border-r-4 border-[#3A3A3A]" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950"}`}
                  >
                    <Icon size={18} className={active ? "text-[#E2A9F1]" : "text-gray-400 dark:text-gray-500"} />
                    {label}
                  </Link>
                );
              })}
            </div>
            {/* Logg ut */}
            <div className="border-t dark:border-gray-700 px-6 py-4 space-y-3 text-sm text-gray-400 dark:text-gray-500">
              <Link href="/om" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 hover:text-gray-600">
                Om Danceitude
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <Link href="/trainer/profil" className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center text-[#c87de0] font-bold text-sm shrink-0">
                  {firstName.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{firstName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Trener</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NotificationBell notifications={notifications} />
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-[#3A3A3A] text-[#E2A9F1]" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <Link href="/om" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            Om Danceitude
          </Link>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
