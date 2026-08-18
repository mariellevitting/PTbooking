"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, User, Phone, FileText, Music, Camera } from "lucide-react";
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
  const [phoneVal, setPhoneVal] = useState(phone);
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
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
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

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ name: nameVal, phone: phoneVal })
      .eq("id", userId);

    const { error: trainerError } = await supabase
      .from("trainers")
      .update({ bio: bioVal, dance_styles: Array.from(selected) })
      .eq("id", userId);

    if (profileError || trainerError) {
      setError("Noe gikk galt, prøv igjen");
    } else {
      setSuccess(true);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Profilbilde */}
      <Card>
        <CardContent className="pt-5 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="Profilbilde" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-[#E2A9F1]">{nameVal.charAt(0)}</span>
              )}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 bg-[#3A3A3A] text-[#E2A9F1] rounded-full p-1.5 hover:bg-[#2a2a2a]">
              <Camera size={14} />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          {uploading && <p className="text-xs text-gray-400 dark:text-gray-500">Laster opp...</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User size={16} className="text-[#E2A9F1]" /> Personlig informasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Navn</label>
            <Input value={nameVal} onChange={(e) => setNameVal(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Phone size={14} className="text-gray-400 dark:text-gray-500" /> Telefon
            </label>
            <Input value={phoneVal} onChange={(e) => setPhoneVal(e.target.value)} placeholder="+47 000 00 000" type="tel" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <FileText size={14} className="text-gray-400 dark:text-gray-500" /> Bio (valgfritt)
            </label>
            <textarea
              value={bioVal}
              onChange={(e) => setBioVal(e.target.value)}
              rows={3}
              placeholder="Kort beskrivelse av deg som trener..."
              className="w-full border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E2A9F1]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Music size={16} className="text-[#E2A9F1]" /> Dansestiler du tilbyr
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 text-[#c87de0] text-sm bg-[#f5eeff] dark:bg-[#E2A9F1]/10 border border-[#E2A9F1]/40 rounded-xl p-3">
          <Check size={16} /> Profilen er oppdatert!
        </div>
      )}

      <Button type="submit" className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a]" disabled={saving || success}>
        {saving ? "Lagrer..." : "Lagre profil"}
      </Button>
      <DeleteAccountSection userId={userId} />
    </form>
  );
}
