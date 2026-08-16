"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/app/actions/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserRole } from "@/types";

const roles: { value: UserRole; label: string; description: string }[] = [
  { value: "dancer", label: "Danser", description: "Jeg booker timer for meg selv" },
  { value: "parent", label: "Forelder", description: "Jeg booker timer for mitt barn" },
  { value: "trainer", label: "Trener", description: "Jeg tilbyr privattimer" },
];

interface Props {
  prefilledCode?: string;
  clubName?: string;
}

export default function RegisterForm({ prefilledCode, clubName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [trainerCode, setTrainerCode] = useState("");
  const [dancerNames, setDancerNames] = useState([""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    setError("");
    const filteredDancers = dancerNames.filter(n => n.trim() !== "");
    const result = await registerUser(
      email, password, name, role,
      trainerCode || undefined,
      filteredDancers.length > 0 ? filteredDancers : undefined
    );
    if (result.error) { setError(result.error); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  const displayName = clubName || "Evolution Danseklubb";

  const formContent = (
    <>
      {step === "role" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hvem er du?</p>
          {roles.map(r => (
            <button key={r.value} onClick={() => { setRole(r.value); setStep("details"); }}
              className="w-full text-left border dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900 hover:border-[#E2A9F1] hover:bg-[#f5eeff] transition-colors">
              <p className="font-semibold text-gray-800 dark:text-gray-100">{r.label}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{r.description}</p>
            </button>
          ))}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Har du allerede konto?{" "}
            <Link href="/login" className="text-[#E2A9F1] hover:underline font-medium">Logg inn</Link>
          </p>
        </div>
      )}

      {step === "details" && (
        <form onSubmit={handleRegister} className="space-y-4">
          <button type="button" onClick={() => setStep("role")} className="text-sm text-[#E2A9F1] hover:underline mb-2">
            ← Endre rolle
          </button>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Navn</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ditt fulle navn" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">E-post</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="din@epost.no" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Passord</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minst 6 tegn" minLength={6} required />
          </div>
          {role === "parent" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Danser(e)</label>
              {dancerNames.map((n, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={n} onChange={e => { const u = [...dancerNames]; u[i] = e.target.value; setDancerNames(u); }}
                    placeholder={`Danser ${i + 1}`} required={i === 0} />
                  {dancerNames.length > 1 && (
                    <button type="button" onClick={() => setDancerNames(dancerNames.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 px-2">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setDancerNames([...dancerNames, ""])}
                className="text-sm text-[#E2A9F1] hover:underline">+ Legg til danser</button>
            </div>
          )}
          {role === "trainer" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Trenerkode</label>
              <Input type="text" value={trainerCode} onChange={e => setTrainerCode(e.target.value)}
                placeholder="Kode fra klubben" required />
              <p className="text-xs text-gray-400 dark:text-gray-500">Kun trenere med kode kan registrere seg.</p>
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a] h-11 text-base" disabled={loading}>
            {loading ? "Oppretter konto..." : "Lag konto"}
          </Button>
        </form>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Desktop – venstre bildekolonne */}
      <div className="hidden md:flex md:w-1/2 relative min-h-screen" style={{ backgroundImage: "url('/dans2.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-end p-10 text-white">
          <p className="text-white/90 text-lg italic mb-3">✦ Av dansere, for dansere</p>
          <h1 className="text-5xl font-bold mb-1">Danceitude</h1>
          <p className="text-white/70 text-lg mb-2">{displayName}</p>
          <p className="text-white/80 text-lg">Book din privattime enkelt og raskt</p>
        </div>
      </div>

      {/* Mobil – fullt bakgrunnsbilde med skjema-kort oppå */}
      <div className="md:hidden relative min-h-screen flex items-end" style={{ backgroundImage: "url('/dans2.jpg')", backgroundSize: "cover", backgroundPosition: "center top" }}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 w-full px-4 pb-4 pt-16">
          <p className="text-white/90 text-sm italic mb-1 px-2">✦ Av dansere, for dansere</p>
          <h1 className="text-3xl font-bold text-white mb-4 px-2">Danceitude</h1>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
              <Link href="/login" className="flex-1 text-center py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400">Logg inn</Link>
              <span className="flex-1 text-center py-2 rounded-lg bg-white dark:bg-gray-900 text-sm font-semibold text-gray-900 dark:text-white shadow-sm">Registrer</span>
            </div>
            {formContent}
          </div>
        </div>
      </div>

      {/* Desktop – høyre skjemakolonne */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950 p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Lag konto</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Kom i gang på under ett minutt</p>
          </div>
          {formContent}
        </div>
      </div>

    </div>
  );
}
