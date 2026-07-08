"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600"
      >
        Logg ut
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Bakgrunn */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          {/* Boks */}
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 mx-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Logg ut</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Er du sikker på at du vil logge ut?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
              >
                Logg ut
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
