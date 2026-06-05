import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function BookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainers } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("role", "trainer")
    .order("name");

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <Link href="/dancer/dashboard" className="text-sm text-purple-600 hover:underline mb-6 block">
          ← Tilbake
        </Link>
        <h1 className="text-2xl font-bold mb-6">Velg trener</h1>

        {!trainers || trainers.length === 0 ? (
          <div className="bg-white rounded-xl border p-6 text-center text-gray-400">
            <p>Ingen trenere tilgjengelig ennå</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trainers.map((trainer) => (
              <Link key={trainer.id} href={`/book/${trainer.id}`}>
                <div className="bg-white rounded-xl border p-4 hover:border-purple-400 hover:shadow-sm transition-all cursor-pointer flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                    {trainer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{trainer.name}</p>
                    <p className="text-sm text-gray-400">Trener</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
