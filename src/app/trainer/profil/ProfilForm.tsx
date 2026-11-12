"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, User, Phone, FileText, Music, Camera, Wallet, Bell } from "lucide-react";
import DeleteAccountSection from "@/components/DeleteAccountSection";

interface Props {
  userId: string;
  name: string;
  phone: string;
  bio: string;
  price?: number | null;
  priceDouble?: number | null;
  showDoublePrice?: boolean;
  danceStyles: string[];
  styleOptions?: string[];
  avatarUrl?: string | null;
  notifyRoomActivity?: boolean;
  paymentMethod?: string | null;
  paymentValue?: string | null;
  showPayment?: boolean;
  showRoomNotify?: boolean;
}

const FALLBACK_STYLES = ["Slow", "Freestyle", "Jazz", "Moderne", "Freestyle dobbel", "Slow dobbel", "Akro", "Hiphop", "Show"];

export default function ProfilForm({ userId, name, phone, bio, price, priceDouble, showDoublePrice = false, danceStyles, styleOptions, avatarUrl, notifyRoomActivity: initialNotifyRoomActivity = true, paymentMethod, paymentValue, showPayment = false, showRoomNotify = false }: Props) {
  const allStyles = styleOptions && styleOptions.length > 0 ? styleOptions : FALLBACK_STYLES;
  const router = useRouter();
  const [nameVal, setNameVal] = useState(name);
  const [phoneVal, setPhoneVal] = useState(() => {
    const raw = phone.replace(/[^0-9+\s]/g, "");
    const digits = raw.replace(/[^0-9]/g, "");
    const maxDigits = raw.startsWith("+") ? 10 : 8;
    if (digits.length <= maxDigits) return raw;
    return raw.startsWith("+") ? "+" + digits.slice(0, 10) : digits.slice(0, 8);
  });
  const [bioVal, setBioVal] = useState(bio);
  const [priceVal, setPriceVal] = useState(price != null ? String(price) : "");
  const [priceDoubleVal, setPriceDoubleVal] = useState(priceDouble != null ? String(priceDouble) : "");
  const [selected, setSelected] = useState<Set<string>>(new Set(danceStyles));
  const [notifyRoomActivity, setNotifyRoomActivity] = useState(initialNotifyRoomActivity);
  const [paymentMethodVal, setPaymentMethodVal] = useState<string>(paymentMethod ?? "vipps");
  const [paymentValueVal, setPaymentValueVal] = useState(paymentValue ?? "");
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

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ name: nameVal, phone: phoneVal, ...(showRoomNotify ? { notify_room_activity: notifyRoomActivity } : {}) })
      .eq("id", userId);

    const { error: trainerError } = await supabase
      .from("trainers")
      .update({
        bio: bioVal,
        dance_styles: Array.from(selected),
        price: priceVal.trim() === "" ? null : Number(priceVal),
        ...(showDoublePrice ? { price_double: priceDoubleVal.trim() === "" ? null : Number(priceDoubleVal) } : {}),
        ...(showPayment ? {
          payment_method: paymentValueVal.trim() === "" ? null : paymentMethodVal,
          payment_value: paymentValueVal.trim() === "" ? null : paymentValueVal.trim(),
        } : {}),
      })
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
            <Input
              value={phoneVal}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9+\s]/g, "");
                const digits = raw.replace(/[^0-9]/g, "");
                const maxDigits = raw.startsWith("+") ? 10 : 8;
                if (digits.length <= maxDigits) setPhoneVal(raw);
              }}
              onKeyDown={(e) => { if (!/[0-9+\s]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) e.preventDefault(); }}
              placeholder="8 siffer"
              type="tel"
              inputMode="numeric"
            />
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Wallet size={14} className="text-gray-400 dark:text-gray-500" /> Timepris (kr)
            </label>
            <Input
              value={priceVal}
              onChange={(e) => setPriceVal(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="F.eks. 150"
              inputMode="numeric"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500">Prisen danseren ser når de booker en vanlig time hos deg.</p>
          </div>
          {showDoublePrice && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Wallet size={14} className="text-gray-400 dark:text-gray-500" /> Timepris dobbel / par (kr)
              </label>
              <Input
                value={priceDoubleVal}
                onChange={(e) => setPriceDoubleVal(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="F.eks. 200"
                inputMode="numeric"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500">La stå tom hvis du ikke tar dobbeltimer, eller hvis prisen er den samme.</p>
            </div>
          )}
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
            {allStyles.map((style) => {
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

      {showPayment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet size={16} className="text-[#E2A9F1]" /> Betaling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Valgfritt. Vises til danser/forelder når de har booket en time hos deg. Står dette tomt, vises klubbens generelle betalingsinfo i stedet.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethodVal("vipps")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${paymentMethodVal === "vipps" ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A] dark:bg-[#c87de0] dark:text-white dark:border-[#c87de0]" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"}`}
              >
                Vipps
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethodVal("bank")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${paymentMethodVal === "bank" ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A] dark:bg-[#c87de0] dark:text-white dark:border-[#c87de0]" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"}`}
              >
                Bankkonto
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{paymentMethodVal === "bank" ? "Kontonummer" : "Vipps-nummer"}</label>
              <Input
                value={paymentValueVal}
                onChange={(e) => setPaymentValueVal(e.target.value)}
                placeholder={paymentMethodVal === "bank" ? "F.eks. 1224 26 96059" : "F.eks. 542018"}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {showRoomNotify && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell size={16} className="text-[#E2A9F1]" /> Varsler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Egentrening i saler</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Varsel når noen booker eller avbestiller en sal</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyRoomActivity(v => !v)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{ background: notifyRoomActivity ? "#E2A9F1" : "#d1d5db" }}
              >
                <span
                  className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                  style={{ transform: notifyRoomActivity ? "translateX(22px)" : "translateX(2px)" }}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 text-[#c87de0] text-sm bg-[#f5eeff] dark:bg-[#E2A9F1]/10 border border-[#E2A9F1]/40 rounded-xl p-3">
          <Check size={16} /> Profilen er oppdatert!
        </div>
      )}

      <Button type="submit" className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white" disabled={saving || success}>
        {saving ? "Lagrer..." : "Lagre profil"}
      </Button>
      <DeleteAccountSection userId={userId} />
    </form>
  );
}
