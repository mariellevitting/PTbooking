"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Feil e-post eller passord");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Venstre – lilla bakgrunn */}
      <div className="hidden md:flex md:w-1/2 relative">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/dans.png')" }} />
        <div className="absolute inset-0 bg-purple-900/60" />
        <div className="relative z-10 flex flex-col justify-end p-10 text-white">
          <p className="text-white/90 text-lg italic mb-3">✦ Av dansere, for dansere</p>
          <h1 className="text-5xl font-bold mb-1">Danceitude</h1>
          <p className="text-white/70 text-lg mb-2">Evolution Danseklubb</p>
          <p className="text-white/80 text-lg">Book din privattime enkelt og raskt</p>
        </div>
      </div>

      {/* Mobil – liten toppdel */}
      <div className="md:hidden h-48 relative bg-purple-800" style={{ backgroundImage: "url('/dans.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <p className="text-white/90 text-sm italic mb-1">✦ Av dansere, for dansere</p>
          <h1 className="text-2xl font-bold text-white">Danceitude</h1>
          <p className="text-white/70 text-xs">Evolution Danseklubb</p>
          <p className="text-white/80 text-sm">Book din privattime</p>
        </div>
      </div>

      {/* Høyre – innloggingsskjema */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Logg inn</h2>
            <p className="text-gray-500 mt-1 text-sm">Velkommen tilbake!</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">E-post</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.no"
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Passord</label>
                <a href="/glemt-passord" className="text-xs text-purple-600 hover:underline">
                  Glemt passordet?
                </a>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 h-11 text-base" disabled={loading}>
              {loading ? "Logger inn..." : "Logg inn"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Har du ikke konto?{" "}
            <Link href="/register" className="text-purple-600 hover:underline font-medium">
              Registrer deg
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
