"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Phone, Camera, Check, Bell } from "lucide-react";
import DeleteAccountSection from "@/components/DeleteAccountSection";

interface Props {
  userId: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  notifyNewSlots: boolean;
}

export default function DancerProfileClient(props: Props) {
  const router = useRouter();
  const [nameVal, setNameVal] = useState(props.name);
  const [phoneVal, setPhoneVal] = useState(props.phone);
  const [notifyNewSlots, setNotifyNewSlots] = useState(props.notifyNewSlots);
  const [avatar, setAvatar] = useState<string | null>(props.avatarUrl);
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
    const path = `${props.userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      setAvatar(url);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", props.userId);
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
    const { error: err } = await supabase.from("profiles").update({
      name: nameVal,
      phone: phoneVal,
      notify_new_slots: notifyNewSlots,
    }).eq("id", props.userId);
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
              {avatar
                ? <img src={avatar} alt="Profilbilde" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-[#E2A9F1]">{nameVal.charAt(0)}</span>}
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

      {/* Personlig info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User size={16} className="text-[#E2A9F1]" /> Personlig informasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Navn</label>
            <Input value={nameVal} onChange={e => { setNameVal(e.target.value); setSuccess(false); }} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Phone size={14} className="text-gray-400 dark:text-gray-500" /> Telefon
            </label>
            <Input
              value={phoneVal}
              onChange={e => { setPhoneVal(e.target.value.replace(/[^0-9+\s]/g, "")); setSuccess(false); }}
              onKeyDown={e => { if (!/[0-9+\s]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) e.preventDefault(); }}
              placeholder="+47 000 00 000"
              type="tel"
              inputMode="numeric"
            />
          </div>
        </CardContent>
      </Card>

      {/* Varsler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell size={16} className="text-[#E2A9F1]" /> Varsler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Nye ledige tider</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Varsel når trenere legger ut tider</p>
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
      <DeleteAccountSection userId={props.userId} />
    </form>
  );
}
