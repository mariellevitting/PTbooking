"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Clock, UserCircle, Trophy, History, PlusCircle } from "lucide-react";
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
  unreadCount: number;
}

export default function TrainerSidebar({ name, avatarUrl, unreadCount }: Props) {
  const pathname = usePathname();

  const firstName = name.split(" ")[0];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-gray-200 z-30">
        {/* Profil-header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                {firstName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{firstName}</p>
              <p className="text-xs text-gray-400">Trener</p>
            </div>
          </div>
        </div>

        {/* Nav-lenker */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/trainer/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bunn */}
        <div className="p-3 border-t border-gray-100 flex items-center justify-between">
          {unreadCount > 0 ? (
            <Link href="/trainer/dashboard" className="relative">
              <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-1 rounded-full">
                {unreadCount} ny{unreadCount !== 1 ? "e" : ""} varsel
              </span>
            </Link>
          ) : (
            <span className="text-xs text-gray-400">Ingen nye varsler</span>
          )}
          <LogoutButton />
        </div>
      </aside>

      {/* Mobilbunnemeny */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex justify-around px-2 py-2">
        {NAV.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/trainer/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                active ? "text-purple-600" : "text-gray-400"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
            </Link>
          );
        })}
        <Link
          href="/trainer/profil"
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
            pathname === "/trainer/profil" ? "text-purple-600" : "text-gray-400"
          }`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <UserCircle size={20} />
          )}
          <span className="text-[10px] font-medium">Profil</span>
        </Link>
      </nav>
    </>
  );
}
