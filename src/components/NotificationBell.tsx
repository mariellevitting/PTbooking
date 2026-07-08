"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Trash2 } from "lucide-react";

interface Notification {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
}

interface Props {
  notifications: Notification[];
}

export default function NotificationBell({ notifications: initial }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initial);
  const [clearing, setClearing] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: Math.max(8, Math.min(rect.right - 320, window.innerWidth - 328)),
      });
    }
    setOpen((v) => !v);
    if (!open && unread > 0) {
      const supabase = createClient();
      const ids = notifications.filter((n) => !n.read).map((n) => n.id);
      await supabase.from("notifications").update({ read: true }).in("id", ids);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  async function handleClear() {
    setClearing(true);
    const supabase = createClient();
    const ids = notifications.map((n) => n.id);
    await supabase.from("notifications").delete().in("id", ids);
    setNotifications([]);
    setClearing(false);
  }

  return (
    <div className="relative">
      <button ref={buttonRef} onClick={handleOpen} className="relative p-1 text-gray-500 dark:text-gray-400 hover:text-purple-600 transition-colors">
        <Bell size={22} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="fixed w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border dark:border-gray-700 z-[200] overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <p className="font-semibold text-sm">Varsler</p>
            {notifications.length > 0 && (
              <button
                onClick={handleClear}
                disabled={clearing}
                className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} /> Tøm
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-400 dark:text-gray-500 text-sm">
              Ingen varsler
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y">
              {notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 flex gap-3 items-start ${!n.read ? "bg-purple-50 dark:bg-purple-950/30" : ""}`}>
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 text-sm font-bold">
                    PT
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-100">{n.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(n.created_at).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })} · {new Date(n.created_at).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
