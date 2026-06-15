"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Clock, UserCircle, Trophy, History, PlusCircle, Menu, X } from "lucide-react";
import { useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";

const NAV = [
  { href: "/trainer/dashboard", label: "Mine timer", icon: Calendar },
  { href: "/trainer/availability", label: "Legg ut tid", icon: PlusCircle },
  { href: "/trainer/book-for-dancer", label: "Book for danser", icon: Clock },
  { href: "/trainer/historikk", label: "Historikk", icon: History },
  { href: "/trainer/konkurranser", label: "Konkurranser", icon: Trophy },
  { href: "/trainer/profil", label: "Profil", icon: UserCircle },
];

interface Props {
  name: string;
  avatarUrl: string | null;
  notifications: any[];
}

export default function TrainerSidebar({ name, avatarUrl, notifications }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = name.split(" ")[0];

  function isActive(href: string) {
    if (href === "/trainer/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobil: lilla topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-purple-600 px-4 py-3 flex items-center justify-between shadow-md">
        <button onClick={() => setMenuOpen(true)} className="p-1.5 rounded-lg hover:bg-purple-700 transition-colors">
          <Menu size={24} className="text-white" />
        </button>
        <p className="text-white font-semibold text-sm">PT Booking</p>
        <div className="flex items-center gap-2">
          <div className="[&_button]:text-white [&_svg]:text-white [&_span]:bg-white [&_span]:text-purple-600">
            <NotificationBell notifications={notifications} />
          </div>
          <Link href="/trainer/profil" className="hover:opacity-80 transition-opacity">
            {avatarUrl
              ? <img src={avatarUrl} alt="Profil" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
              : <div className="w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center text-white font-bold text-sm">{firstName.charAt(0)}</div>
            }
          </Link>
        </div>
      </div>

      {/* Mobil: slide-in drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex justify-end p-4">
              <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            {/* Profil */}
            <Link href="/trainer/profil" onClick={() => setMenuOpen(false)} className="px-6 pb-6 flex items-center gap-4 border-b hover:bg-gray-50 transition-colors">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl
                  ? <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-purple-600">{firstName.charAt(0)}</span>}
              </div>
              <div>
                <p className="font-bold text-gray-800">{name}</p>
                <p className="text-xs text-purple-500">Se profil →</p>
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
                    className={`w-full flex items-center gap-4 px-6 py-3.5 text-sm font-medium transition-colors ${active ? "bg-purple-50 text-purple-700 border-r-4 border-purple-600" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Icon size={18} className={active ? "text-purple-600" : "text-gray-400"} />
                    {label}
                  </Link>
                );
              })}
            </div>
            {/* Logg ut */}
            <div className="border-t px-6 py-4 text-sm text-gray-400">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-gray-200 z-30">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                  {firstName.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{firstName}</p>
                <p className="text-xs text-gray-400">Trener</p>
              </div>
            </div>
            <NotificationBell notifications={notifications} />
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
                  active ? "bg-purple-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
