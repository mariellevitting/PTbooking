"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, FileText, Music, Camera } from "lucide-react";
import DeleteAccountSection from "@/components/DeleteAccountSection";

const ALL_STYLES = [
  "Slow",
  "Freestyle",
  "Jazz",
  "Moderne",
  "Freestyle dobbel",
  "Slow dobbel",
  "Akro",
  "Hiphop",
  "Show",
];

interface Props {
  userId: string;
  name: string;
  phone: string;
  bio: string;
  danceStyles: string[];
  avatarUrl?: string | null;
}

export default function ProfilForm({ userId, name, phone, bio, danceStyles, avatarUrl }: Props) {
  const router = useRouter();
  const [nameVal, setNameVal] = useState(name);
  const [phoneVal, setPhoneVal] = useState(() => {
    const raw = phone.replace(/[^0-9+\s]/g, "");
    const digits = raw.replace(/[^0-9]/g, "");
    const maxDigits = raw.startsWith("+") ? 10 : 8;
    return digits.length <= maxDigits ? raw : raw.startsWith("+") ? "+" + digits.slice(0, 10) : digits.slice(0, 8);
  });
  const [bioVal, setBioVal] = useState(bio);
  const [selected, setSelected] = useState<Set<string>>(new Set(danceStyles));
  const [avatar, setAvatar] = useState<string | null>(avatarUrl ?? null);
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
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      setAvatar(url);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
      router.refresh();
    }
    setUploading(false);
  }

  function toggleStyle(style: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(style) ? next.delete(style) : next.add(style);
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) {
      setError("Velg minst én dansestil");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);
    const supabase = createClient();
    const { error: profileError } = await supabase.from("profiles").update({ name: nameVal, phone: phoneVal }).eq("id", userId);
    const { error: trainerError } = await supabase.from("trainers").update({ bio: bioVal, dance_styles: Array.from(selected) }).eq("id", userId);
    if (profileError || trainerError) setError("Noe gikk galt, prøv igjen");
    else setSuccess(true);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave}>
      {/* Hero-header */}
      <div className="relative bg-gradient-to-br from-[#c87de0] to-[#9b4fc2] dark:from-[#7a2fa0] dark:to-[#4a1260] px-6 pt-8 pb-16 flex flex-col items-center gap-3 -mx-6 -mt-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-white/40 overflow-hidden bg-white/20 flex items-center justify-center">
            {avatar
              ? <img src={avatar} alt="Profilbilde" className="w-full h-full object-cover" />
              : <span className="text-3xl font-bold text-white">{nameVal.charAt(0)}</span>}
          </div>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 bg-white/90 text-[#9b4fc2] rounded-full p-1.5 shadow">
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
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#c87de0]">Navn</label>
          <input
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            required
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]/50"
          />
        </div>

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

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#c87de0] flex items-center gap-1.5">
            <FileText size={13} /> Bio (valgfritt)
          </label>
          <textarea
            value={bioVal}
            onChange={(e) => setBioVal(e.target.value)}
            rows={3}
            placeholder="Kort beskrivelse av deg som trener..."
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]/50 resize-none"
          />
        </div>
      </div>

      {/* Dansestiler */}
      <div className="mx-2 mt-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#c87de0] flex items-center gap-1.5 mb-3">
          <Music size={13} /> Dansestiler du tilbyr
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ALL_STYLES.map((style) => {
            const isSelected = selected.has(style);
            return (
              <button
                key={style}
                type="button"
                onClick={() => toggleStyle(style)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A]"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#E2A9F1]"
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-white border-white" : "border-gray-300 dark:border-gray-600"
                }`}>
                  {isSelected && <Check size={11} className="text-[#E2A9F1]" strokeWidth={3} />}
                </div>
                {style}
              </button>
            );
          })}
        </div>
        {selected.size > 0 && (
          <p className="text-xs text-[#E2A9F1] mt-3">{selected.size} stil{selected.size !== 1 ? "er" : ""} valgt</p>
        )}
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
