"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerUser } from "@/app/actions/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserRole } from "@/types";

const roles: { value: UserRole; label: string; description: string }[] = [
  { value: "dancer", label: "Danser", description: "Jeg booker timer for meg selv" },
  { value: "parent", label: "Forelder", description: "Jeg booker timer for mitt barn" },
  { value: "trainer", label: "Trener", description: "Jeg tilbyr privattimer" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [trainerCode, setTrainerCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    setError("");

    const result = await registerUser(email, password, name, role, trainerCode || undefined);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Lag konto</CardTitle>
          <p className="text-sm text-gray-500">Evolution Danseklubb</p>
        </CardHeader>
        <CardContent>
          {step === "role" ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-center mb-4">Hvem er du?</p>
              {roles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => { setRole(r.value); setStep("details"); }}
                  className="w-full text-left border rounded-lg p-4 hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <p className="font-medium">{r.label}</p>
                  <p className="text-sm text-gray-500">{r.description}</p>
                </button>
              ))}
              <p className="text-center text-sm text-gray-500 mt-4">
                Har du allerede konto?{" "}
                <Link href="/login" className="text-purple-600 hover:underline">Logg inn</Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <button type="button" onClick={() => setStep("role")} className="text-sm text-purple-600 hover:underline mb-2">
                ← Endre rolle
              </button>
              <div className="space-y-2">
                <label className="text-sm font-medium">Navn</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ditt fulle navn" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-post</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="din@epost.no" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Passord</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minst 6 tegn" minLength={6} required />
              </div>
              {role === "trainer" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trenerkode</label>
                  <Input
                    type="password"
                    value={trainerCode}
                    onChange={(e) => setTrainerCode(e.target.value)}
                    placeholder="Kode fra klubben"
                    required
                  />
                  <p className="text-xs text-gray-400">Kun trenere med kode fra Evolution kan registrere seg.</p>
                </div>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Oppretter konto..." : "Lag konto"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
