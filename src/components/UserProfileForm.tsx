"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Camera, Check, Trash2 } from "lucide-react";

interface Props {
  userId: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
}

export default function UserProfileForm({ userId, name, phone, avatarUrl }: Props) {
  const router = useRouter();
  const [nameVal, setNameVal] = useState(name);
  const [phoneVal, setPhoneVal] = useState(phone.replace(/[^0-9+\s]/g, ""));
  const [avatar, setAvatar] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      setAvatar(data.publicUrl + "?t=" + Date.now());
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
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
      .update({ name: nameVal, phone: phoneVal })
      .eq("id", userId);
    if (err) setError("Noe gikk galt");
    else setSuccess(true);
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
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 bg-[#3A3A3A] text-[#E2A9F1] rounded-full p-1.5 hover:bg-[#2a2a2a]"
            >
              <Camera size={14} />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          {uploading && <p className="text-xs text-gray-400 dark:text-gray-500">Laster opp...</p>}
        </CardContent>
      </Card>

      {/* Info */}
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
            <Input
              value={phoneVal}
              onChange={(e) => setPhoneVal(e.target.value.replace(/[^0-9+\s]/g, ""))}
              onKeyDown={(e) => { if (!/[0-9+\s]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) e.preventDefault(); }}
              placeholder="+47 000 00 000"
              type="tel"
              inputMode="numeric"
            />
          </div>
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

      {/* Slett konto */}
      <div className="border-t dark:border-gray-700 pt-6 mt-2">
        {!deleteConfirm ? (
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center gap-2 text-sm text-red-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} /> Slett konto
          </button>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Er du sikker?</p>
            <p className="text-xs text-red-600 dark:text-red-400">Dette sletter kontoen din permanent. Alle bookinger og data vil bli slettet og kan ikke gjenopprettes.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  setDeleting(true);
                  const supabase = createClient();
                  await supabase.from("profiles").delete().eq("id", userId);
                  await fetch("/api/delete-account", { method: "POST" });
                  await supabase.auth.signOut();
                  router.push("/login");
                }}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? "Sletter..." : "Ja, slett kontoen min"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold py-2 rounded-lg transition-colors"
              >
                Avbryt
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
