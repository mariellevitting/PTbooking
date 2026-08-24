"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Camera, Check, Bell } from "lucide-react";
import DeleteAccountSection from "@/components/DeleteAccountSection";

interface Props {
  userId: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  notifyNewSlots?: boolean;
}

export default function UserProfileForm({ userId, name, phone, avatarUrl, notifyNewSlots: initialNotify = true }: Props) {
  const router = useRouter();
  const [nameVal, setNameVal] = useState(name);
  const [phoneVal, setPhoneVal] = useState(() => {
    const raw = phone.replace(/[^0-9+\s]/g, "");
    const digits = raw.replace(/[^0-9]/g, "");
    const maxDigits = raw.startsWith("+") ? 10 : 8;
    return digits.length <= maxDigits ? raw : raw.startsWith("+") ? "+" + digits.slice(0, 10) : digits.slice(0, 8);
  });
  const [notifyNewSlots, setNotifyNewSlots] = useState(initialNotify);
  const [avatar, setAvatar] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      setAvatar(url);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
      router.refresh();
    }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({ name: nameVal, phone: phoneVal, notify_new_slots: notifyNewSlots })
      .eq("id", userId);
    if (err) setError("Noe gikk galt");
    else setSuccess(true);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave}>
      {/* Hero-header */}
      <div className="relative bg-gradient-to-br from-[#c87de0] to-[#9b4fc2] dark:from-[#7a2fa0] dark:to-[#4a1260] px-6 pt-8 pb-16 flex flex-col items-center gap-3 -mx-6 -mt-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-white/40 overflow-hidden bg-white/20 flex items-center justify-center">
            {avatar ? (
              <img src={avatar} alt="Profilbilde" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white">{nameVal.charAt(0)}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 bg-white/90 text-[#9b4fc2] rounded-full p-1.5 shadow"
          >
            <Camera size={14} />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        {uploading && <p className="text-xs text-white/70">Laster opp...</p>}
        <p className="text-white font-semibold text-lg">{nameVal || "Navn"}</p>
        {phoneVal && <p className="text-white/80 text-sm">{phoneVal}</p>}
      </div>

      {/* Innhold */}
      <div className="relative -mt-8 mx-2 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 px-5 py-5 space-y-5">

        {/* Navn */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#c87de0]">Navn</label>
          <input
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            required
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]/50"
          />
        </div>

        {/* Telefon */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#c87de0]">Telefon</label>
          <input
            value={phoneVal}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9+\s]/g, "");
              const digits = raw.replace(/[^0-9]/g, "");
              const maxDigits = raw.startsWith("+") ? 10 : 8;
              if (digits.length <= maxDigits) setPhoneVal(raw);
            }}
            onKeyDown={(e) => { if (!/[0-9+\s]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) e.preventDefault(); }}
            placeholder="+47 000 00 000"
            type="tel"
            inputMode="numeric"
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]/50"
          />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-[#E2A9F1]" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Nye ledige tider</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Varsel når trenere legger ut tider</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotifyNewSlots(v => !v)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{ background: notifyNewSlots ? "#E2A9F1" : "#d1d5db" }}
            >
              <span
                className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                style={{ transform: notifyNewSlots ? "translateX(22px)" : "translateX(2px)" }}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 px-2 space-y-3">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && (
          <div className="flex items-center gap-2 text-[#c87de0] text-sm bg-[#f5eeff] dark:bg-[#E2A9F1]/10 border border-[#E2A9F1]/40 rounded-xl p-3">
            <Check size={16} /> Profilen er oppdatert!
          </div>
        )}
        <button
          type="submit"
          disabled={saving || success}
          className={`w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm ${success ? "bg-[#c87de0]/50 cursor-default" : "bg-[#c87de0] hover:bg-[#b56fd0]"}`}
        >
          {saving ? "Lagrer..." : "Lagre profil"}
        </button>
        <DeleteAccountSection userId={userId} />
      </div>
    </form>
  );
}
