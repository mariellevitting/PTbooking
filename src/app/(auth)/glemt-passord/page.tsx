"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GlemtPassordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nytt-passord`,
    });

    if (error) {
      setError("Noe gikk galt, prøv igjen");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 relative bg-purple-600">
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

      <div className="flex flex-1 items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">📧</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Sjekk e-posten din</h2>
              <p className="text-gray-500 text-sm">
                Vi har sendt en lenke til <strong>{email}</strong>. Klikk på lenken for å sette nytt passord.
              </p>
              <p className="text-xs text-gray-400">
                Finner du ikke e-posten? Sjekk søppelpost/spam-mappen. 🗑️
              </p>
              <Link href="/login" className="text-purple-600 hover:underline text-sm block">
                Tilbake til innlogging
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Glemt passord?</h2>
                <p className="text-gray-500 mt-1 text-sm">Skriv inn e-posten din så sender vi en lenke.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 h-11 text-base" disabled={loading}>
                  {loading ? "Sender..." : "Send tilbakestillingslenke"}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                <Link href="/login" className="text-purple-600 hover:underline">
                  Tilbake til innlogging
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
