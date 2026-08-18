"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export default function DeleteAccountSection({ userId }: { userId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("profiles").delete().eq("id", userId);
    await fetch("/api/delete-account", { method: "POST" });
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="border-t dark:border-gray-700 pt-6 mt-2">
      {!confirm ? (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} /> Slett konto
        </button>
      ) : (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Er du sikker?</p>
          <p className="text-xs text-red-600 dark:text-red-400">
            Dette sletter kontoen din permanent. Alle bookinger og data vil bli slettet og kan ikke gjenopprettes.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? "Sletter..." : "Ja, slett kontoen min"}
            </button>
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold py-2 rounded-lg transition-colors"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
