"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerUser } from "@/app/actions/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserRole } from "@/types";

const roles: { value: UserRole; label: string; description: string }[] = [
  { value: "dancer", label: "Danser", description: "Jeg booker timer for meg selv" },
  { value: "parent", label: "Forelder", description: "Jeg booker timer for mitt barn" },
  { value: "trainer", label: "Trener", description: "Jeg tilbyr privattimer" },
];

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [trainerCode, setTrainerCode] = useState("");
  const [memberCode, setMemberCode] = useState("");
  const [dancerNames, setDancerNames] = useState([""]);
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoginError("Feil e-post eller passord"); setLoginLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setRegLoading(true);
    setRegError("");
    const filteredDancers = dancerNames.filter(n => n.trim() !== "");
    const result = await registerUser(
      regEmail, regPassword, name, role,
      trainerCode || undefined,
      filteredDancers.length > 0 ? filteredDancers : undefined,
      undefined,
      memberCode || undefined
    );
    if (result.error) { setRegError(result.error); setRegLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  function switchTab(t: "login" | "register") {
    setTab(t);
    setLoginError("");
    setRegError("");
  }

  const tabs = (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
      <button onClick={() => switchTab("login")}
        className={`flex-1 text-center py-2 rounded-lg text-sm font-semibold transition-all ${tab === "login" ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
        Logg inn
      </button>
      <button onClick={() => switchTab("register")}
        className={`flex-1 text-center py-2 rounded-lg text-sm font-semibold transition-all ${tab === "register" ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
        Registrer
      </button>
    </div>
  );

  const loginForm = (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">E-post</label>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="din@epost.no" required />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Passord</label>
          <a href="/glemt-passord" className="text-xs text-purple-600 hover:underline">Glemt passordet?</a>
        </div>
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
      </div>
      {loginError && <p className="text-sm text-red-500">{loginError}</p>}
      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 h-11 text-base" disabled={loginLoading}>
        {loginLoading ? "Logger inn..." : "Logg inn"}
      </Button>
    </form>
  );

  const registerForm = (
    <>
      {step === "role" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hvem er du?</p>
          {roles.map(r => (
            <button key={r.value} onClick={() => { setRole(r.value); setStep("details"); }}
              className="w-full text-left border dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900 hover:border-purple-500 hover:bg-purple-50 transition-colors">
              <p className="font-semibold text-gray-800 dark:text-gray-100">{r.label}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{r.description}</p>
            </button>
          ))}
        </div>
      )}
      {step === "details" && (
        <form onSubmit={handleRegister} className="space-y-4">
          <button type="button" onClick={() => setStep("role")} className="text-sm text-purple-600 hover:underline">← Endre rolle</button>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Navn</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ditt fulle navn" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">E-post</label>
            <Input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="din@epost.no" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Passord</label>
            <Input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Minst 6 tegn" minLength={6} required />
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
                className="text-sm text-purple-600 hover:underline">+ Legg til danser</button>
            </div>
          )}
          {(role === "dancer" || role === "parent") && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Klubbkode</label>
              <Input type="text" value={memberCode} onChange={e => setMemberCode(e.target.value)} placeholder="Kode fra Evolution" required />
              <p className="text-xs text-gray-400 dark:text-gray-500">Du får koden av klubben via Spond eller e-post.</p>
            </div>
          )}
          {role === "trainer" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Trenerkode</label>
              <Input type="text" value={trainerCode} onChange={e => setTrainerCode(e.target.value)} placeholder="Kode fra klubben" required />
              <p className="text-xs text-gray-400 dark:text-gray-500">Kun trenere med kode kan registrere seg.</p>
            </div>
          )}
          {regError && <p className="text-sm text-red-500">{regError}</p>}
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 h-11 text-base" disabled={regLoading}>
            {regLoading ? "Oppretter konto..." : "Lag konto"}
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
          <p className="text-white/70 text-lg mb-2">Evolution Danseklubb</p>
          <p className="text-white/80 text-lg">Book din privattime enkelt og raskt</p>
        </div>
      </div>

      {/* Mobil – fullt bakgrunnsbilde med kort oppå */}
      <div className="md:hidden relative min-h-screen flex items-center" style={{ backgroundImage: "url('/dans2.jpg')", backgroundSize: "cover", backgroundPosition: "center top" }}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 w-full px-4 pb-4 pt-8">
          <p className="text-white/90 text-sm italic mb-1 px-2">✦ Av dansere, for dansere</p>
          <h1 className="text-3xl font-bold text-white mb-4 px-2">Danceitude</h1>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl">
            {tabs}
            {tab === "login" ? loginForm : registerForm}
          </div>
        </div>
      </div>

      {/* Desktop – høyre skjemakolonne */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950 p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Logg inn</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Velkommen tilbake!</p>
          </div>
          {loginForm}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Har du ikke konto?{" "}
            <a href="/register" className="text-purple-600 hover:underline font-medium">Registrer deg</a>
          </p>
        </div>
      </div>

    </div>
  );
}
