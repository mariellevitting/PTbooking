"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NyttPassordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("Noe gikk galt, prøv igjen");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 relative bg-[#3A3A3A]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-800" />
        <div className="relative z-10 flex flex-col justify-end p-10 text-white">
          <p className="text-white/90 text-lg italic mb-3">✦ Av dansere, for dansere</p>
          <h1 className="text-4xl font-bold mb-2">Evolution Danseklubb</h1>
          <p className="text-white/80 text-lg">Book din privattime enkelt og raskt</p>
        </div>
      </div>

      <div className="md:hidden h-48 relative bg-gradient-to-br from-purple-500 to-purple-800">
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <p className="text-white/90 text-sm italic mb-1">✦ Av dansere, for dansere</p>
          <h1 className="text-2xl font-bold text-white">Evolution Danseklubb</h1>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-950 p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Nytt passord</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Velg et nytt passord for kontoen din.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nytt passord</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bekreft passord</label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a] h-11 text-base" disabled={loading}>
              {loading ? "Lagrer..." : "Sett nytt passord"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
