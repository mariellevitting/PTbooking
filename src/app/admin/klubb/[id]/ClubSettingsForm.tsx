"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

type Club = Record<string, any> & { id: string };

const MASTER_STYLES = [
  "Slow",
  "Freestyle",
  "Freestyle dobbel",
  "Slow dobbel",
  "Jazz",
  "Moderne",
  "Akro",
  "Hiphop",
  "Show",
];

const fieldCls =
  "w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white";

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1">
      <label className="text-sm font-medium text-gray-800 dark:text-gray-100">{children}</label>
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5 space-y-4">
      <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
      {children}
    </div>
  );
}

export default function ClubSettingsForm({ club }: { club: Club }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: club.name ?? "",
    short_name: club.short_name ?? "",
    city: club.city ?? "",
    website: club.website ?? "",
    primary_color: club.primary_color ?? "#7c3aed",
    invite_code: club.invite_code ?? "",
    trainer_code: club.trainer_code ?? "",
    dancer_code: club.dancer_code ?? "",
    parent_code: club.parent_code ?? "",
    lesson_info: club.lesson_info ?? "",
    lesson_duration_min: club.lesson_duration_min ?? 30,
    lesson_price_text: club.lesson_price_text ?? "",
    default_price: club.default_price ?? 150,
    payment_label: club.payment_label ?? "",
    payment_info: club.payment_info ?? "",
    payment_url: club.payment_url ?? "",
    receipt_note: club.receipt_note ?? "",
    contact_name: club.contact_name ?? "",
    contact_info: club.contact_info ?? "",
  });
  const [styles, setStyles] = useState<string[]>(club.dance_styles ?? []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const styleOptions = Array.from(new Set([...MASTER_STYLES, ...styles]));

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function toggleStyle(s: string) {
    setStyles(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase
      .from("clubs")
      .update({
        name: form.name.trim(),
        short_name: form.short_name.trim() || null,
        city: form.city.trim() || null,
        website: form.website.trim() || null,
        primary_color: form.primary_color.trim() || null,
        invite_code: form.invite_code.trim().toUpperCase(),
        trainer_code: form.trainer_code.trim() || null,
        dancer_code: form.dancer_code.trim() || null,
        parent_code: form.parent_code.trim() || null,
        lesson_info: form.lesson_info.trim() || null,
        lesson_duration_min: Number(form.lesson_duration_min) || null,
        lesson_price_text: form.lesson_price_text.trim() || null,
        default_price: Number(form.default_price) || null,
        payment_label: form.payment_label.trim() || null,
        payment_info: form.payment_info.trim() || null,
        payment_url: form.payment_url.trim() || null,
        receipt_note: form.receipt_note.trim() || null,
        contact_name: form.contact_name.trim() || null,
        contact_info: form.contact_info.trim() || null,
        dance_styles: styles,
      })
      .eq("id", club.id);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <Section title="Klubb">
        <div>
          <Label>Navn</Label>
          <Input value={form.name} onChange={e => set("name", e.target.value)} />
        </div>
        <div>
          <Label hint="Kort navn som vises i appen">Kortnavn</Label>
          <Input value={form.short_name} onChange={e => set("short_name", e.target.value)} />
        </div>
        <div>
          <Label>Sted</Label>
          <Input value={form.city} onChange={e => set("city", e.target.value)} />
        </div>
        <div>
          <Label hint="Vises på registreringssiden">Nettside</Label>
          <Input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://" />
        </div>
        <div>
          <Label hint="Ikke i bruk i appen ennå">Klubbfarge</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.primary_color}
              onChange={e => set("primary_color", e.target.value)}
              className="h-9 w-14 rounded border dark:border-gray-700 bg-transparent"
            />
            <Input value={form.primary_color} onChange={e => set("primary_color", e.target.value)} />
          </div>
        </div>
      </Section>

      <Section title="Registreringskoder">
        <div>
          <Label hint="Gir lenken /register/KODE">Klubbkode</Label>
          <Input value={form.invite_code} onChange={e => set("invite_code", e.target.value.toUpperCase())} />
        </div>
        <div>
          <Label hint="Valgfritt – egen kode per rolle">Trenerkode</Label>
          <Input value={form.trainer_code} onChange={e => set("trainer_code", e.target.value)} />
        </div>
        <div>
          <Label>Danserkode</Label>
          <Input value={form.dancer_code} onChange={e => set("dancer_code", e.target.value)} />
        </div>
        <div>
          <Label>Foreldrekode</Label>
          <Input value={form.parent_code} onChange={e => set("parent_code", e.target.value)} />
        </div>
      </Section>

      <Section title="Privattimer">
        <div>
          <Label hint="Introtekst i «Bestille privattimer»">Info-tekst</Label>
          <textarea
            value={form.lesson_info}
            onChange={e => set("lesson_info", e.target.value)}
            rows={4}
            className={fieldCls}
          />
        </div>
        <div>
          <Label>Varighet (minutter)</Label>
          <Input
            type="number"
            value={form.lesson_duration_min}
            onChange={e => set("lesson_duration_min", e.target.value as any)}
          />
        </div>
        <div>
          <Label hint="Tekst om pris. Skriv **tekst** for fet skrift.">Pris-tekst</Label>
          <Input value={form.lesson_price_text} onChange={e => set("lesson_price_text", e.target.value)} />
        </div>
        <div>
          <Label hint="Brukes når en trener ikke har satt egen pris">Standardpris (kr)</Label>
          <Input
            type="number"
            value={form.default_price}
            onChange={e => set("default_price", e.target.value as any)}
          />
        </div>
      </Section>

      <Section title="Betaling">
        <div>
          <Label hint='Kort navn, f.eks. "Spond" eller "Vipps"'>Betalingsmåte</Label>
          <Input value={form.payment_label} onChange={e => set("payment_label", e.target.value)} />
        </div>
        <div>
          <Label hint="Vises til danser/forelder. **tekst** blir en lenke hvis lenke er satt under.">
            Betalingstekst
          </Label>
          <textarea
            value={form.payment_info}
            onChange={e => set("payment_info", e.target.value)}
            rows={3}
            className={fieldCls}
          />
        </div>
        <div>
          <Label hint="Valgfri lenke (Spond o.l.)">Betalingslenke</Label>
          <Input value={form.payment_url} onChange={e => set("payment_url", e.target.value)} placeholder="https://" />
        </div>
        <div>
          <Label>«Husk kvittering»-tekst</Label>
          <textarea
            value={form.receipt_note}
            onChange={e => set("receipt_note", e.target.value)}
            rows={2}
            className={fieldCls}
          />
        </div>
      </Section>

      <Section title="Kontakt">
        <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">Vises nederst i «Om privattimer»</p>
        <div>
          <Label>Kontaktperson</Label>
          <Input value={form.contact_name} onChange={e => set("contact_name", e.target.value)} />
        </div>
        <div>
          <Label hint="E-post eller telefon">Kontaktinfo</Label>
          <Input value={form.contact_info} onChange={e => set("contact_info", e.target.value)} />
        </div>
      </Section>

      <Section title="Dansestiler">
        <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">Hvilke stiler klubben tilbyr</p>
        <div className="flex flex-wrap gap-2">
          {styleOptions.map(s => {
            const on = styles.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStyle(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  on
                    ? "bg-[#3A3A3A] text-[#E2A9F1] border-[#3A3A3A]"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                }`}
              >
                {on && <Check size={13} strokeWidth={3} />}
                {s}
              </button>
            );
          })}
        </div>
      </Section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="sticky bottom-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-11 bg-[#3A3A3A] hover:bg-[#2a2a2a] text-base shadow-lg"
        >
          {saving ? "Lagrer..." : saved ? "✓ Lagret" : "Lagre endringer"}
        </Button>
      </div>
    </div>
  );
}
