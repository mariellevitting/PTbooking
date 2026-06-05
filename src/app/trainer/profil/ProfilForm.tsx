"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, User, Phone, FileText, Music } from "lucide-react";

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
}

export default function ProfilForm({ userId, name, phone, bio, danceStyles }: Props) {
  const [nameVal, setNameVal] = useState(name);
  const [phoneVal, setPhoneVal] = useState(phone);
  const [bioVal, setBioVal] = useState(bio);
  const [selected, setSelected] = useState<Set<string>>(new Set(danceStyles));
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User size={16} className="text-purple-500" /> Personlig informasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Navn</label>
            <Input value={nameVal} onChange={(e) => setNameVal(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Phone size={14} className="text-gray-400" /> Telefon
            </label>
            <Input value={phoneVal} onChange={(e) => setPhoneVal(e.target.value)} placeholder="+47 000 00 000" type="tel" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <FileText size={14} className="text-gray-400" /> Bio (valgfritt)
            </label>
            <textarea
              value={bioVal}
              onChange={(e) => setBioVal(e.target.value)}
              rows={3}
              placeholder="Kort beskrivelse av deg som trener..."
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Music size={16} className="text-purple-500" /> Dansestiler du tilbyr
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
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-purple-300"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-white border-white" : "border-gray-300"
                  }`}>
                    {isSelected && <Check size={11} className="text-purple-600" strokeWidth={3} />}
                  </div>
                  {style}
                </button>
              );
            })}
          </div>
          {selected.size > 0 && (
            <p className="text-xs text-purple-600 mt-3">{selected.size} stil{selected.size !== 1 ? "er" : ""} valgt</p>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-xl p-3">
          <Check size={16} /> Profilen er oppdatert!
        </div>
      )}

      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={saving}>
        {saving ? "Lagrer..." : "Lagre profil"}
      </Button>
    </form>
  );
}
