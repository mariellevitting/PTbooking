"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { KeyRound, Check } from "lucide-react";

export default function ChangePasswordSection() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (password.length < 6) {
      setError("Passordet må være minst 6 tegn");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passordene er ikke like");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError("Kunne ikke endre passord: " + updateError.message);
      return;
    }
    setPassword("");
    setConfirmPassword("");
    setOpen(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="border-t dark:border-gray-700 pt-6 mt-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <KeyRound size={14} /> Endre passord
        </button>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nytt passord</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minst 6 tegn" minLength={6} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Bekreft nytt passord</label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Skriv passordet på nytt" minLength={6} />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-xs text-red-500">Passordene er ikke like</p>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2"
            >
              {saving ? "Lagrer..." : "Lagre nytt passord"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setPassword(""); setConfirmPassword(""); setError(""); }}
              className="px-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-[#c87de0] text-sm bg-[#f5eeff] dark:bg-[#E2A9F1]/10 border border-[#E2A9F1]/40 rounded-xl p-3 mt-3">
          <Check size={16} /> Passord endret!
        </div>
      )}
    </div>
  );
}
