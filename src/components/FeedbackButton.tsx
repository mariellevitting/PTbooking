"use client";

import { useState } from "react";
import { MessageSquare, X, Send, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  userName: string;
  role: string;
}

export default function FeedbackButton({ userId, userName, role }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("feedback").insert({ user_id: userId, user_name: userName, role, message: message.trim() });
    setLoading(false);
    setSent(true);
    setMessage("");
    setTimeout(() => { setSent(false); setOpen(false); }, 2000);
  }

  return (
    <>
      {/* Flytende knapp */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white text-[#E2A9F1] rounded-full shadow-lg flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all hover:scale-105"
      >
        <MessageSquare size={16} />
        <span className="hidden sm:inline">Gi tilbakemelding</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gi tilbakemelding</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {sent ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle size={40} className="text-green-500" />
                <p className="font-semibold text-gray-800 dark:text-white">Takk for tilbakemeldingen!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Det hjelper oss å gjøre appen bedre.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hva fungerer bra? Hva kan bli bedre? Del gjerne alt – stort og smått.
                </p>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Skriv din tilbakemelding her..."
                  rows={5}
                  required
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]"
                />
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Send size={15} />
                  {loading ? "Sender..." : "Send tilbakemelding"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
