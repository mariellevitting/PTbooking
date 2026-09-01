"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/authClient";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function NyttPassordForm() {
  const searchParams = useSearchParams();
  const clientRef = useRef<SupabaseClient | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const supabase = createAuthClient();
    clientRef.current = supabase;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) { setSessionReady(true); setVerifying(false); }
    });

    // Ny lenke-type: token_hash i URL-en byttes mot en sesjon.
    // Fungerer uansett nettleser/enhet (ingen PKCE-verifier trengs).
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    const code = searchParams.get("code");

    (async () => {
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          type: (type as "recovery") || "recovery",
          token_hash: tokenHash,
        });
        if (error) setError("Lenken er ugyldig eller utløpt. Be om en ny tilbakestillingslenke.");
      } else if (code) {
        // Eldre PKCE-lenke – funker bare i samme nettleser som ba om lenka
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) setError("Lenken virker ikke i denne nettleseren. Åpne den i samme nettleser du ba om tilbakestilling fra, eller be om en ny lenke.");
      }
      // Gi implicit-hash / onAuthStateChange et øyeblikk før vi konkluderer
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) setSessionReady(true);
        setVerifying(false);
      }, 400);
    })();

    return () => subscription.unsubscribe();
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passordene stemmer ikke overens");
      return;
    }
    if (password.length < 6) {
      setError("Passordet må være minst 6 tegn");
      return;
    }
    setLoading(true);
    setError("");

    const supabase = clientRef.current ?? createAuthClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      if (error.message.toLowerCase().includes("same password") || error.message.toLowerCase().includes("different")) {
        setError("Du kan ikke bruke det samme passordet som før. Velg et nytt passord.");
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setDone(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 relative bg-[#3A3A3A]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-800" />
        <div className="relative z-10 flex flex-col justify-end p-10 text-white">
          <p className="text-white/90 text-lg italic mb-3">✦ Av dansere, for dansere</p>
          <h1 className="text-4xl font-bold mb-2">Danceitude</h1>
          <p className="text-white/80 text-lg">Book din privattime enkelt og raskt</p>
        </div>
      </div>

      <div className="md:hidden h-48 relative bg-gradient-to-br from-purple-500 to-purple-800">
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <p className="text-white/90 text-sm italic mb-1">✦ Av dansere, for dansere</p>
          <h1 className="text-2xl font-bold text-white">Danceitude</h1>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950 p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Nytt passord</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Velg et nytt passord for kontoen din.</p>
          </div>

          {done ? (
            <div className="space-y-4">
              <p className="text-sm text-green-600 dark:text-green-400">Passordet er endret! 🎉</p>
              <Link href="/login" className="inline-block w-full">
                <Button className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a] h-11 text-base">Logg inn med nytt passord</Button>
              </Link>
            </div>
          ) : verifying ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Verifiserer lenken…</p>
          ) : !sessionReady ? (
            <div className="space-y-4">
              <p className="text-sm text-red-500">
                {error || "Lenken er ugyldig eller utløpt."}
              </p>
              <a href="/glemt-passord" className="inline-block text-sm text-[#E2A9F1] hover:underline font-medium">
                Be om en ny tilbakestillingslenke →
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nytt passord</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bekreft passord</label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a] h-11 text-base" disabled={loading}>
                {loading ? "Lagrer..." : "Sett nytt passord"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NyttPassordPage() {
  return (
    <Suspense>
      <NyttPassordForm />
    </Suspense>
  );
}
