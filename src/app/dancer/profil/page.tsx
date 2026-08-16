import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DancerProfileClient from "./DancerProfileClient";

export default async function DancerProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "dancer") redirect("/dashboard");

  return (
    <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 page-safe-top">
      <div className="max-w-lg mx-auto">
        <Link href="/dancer/dashboard" className="inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-[#E2A9F1]/10 text-[#E2A9F1] mb-2 -ml-2">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </Link>
        <h1 className="text-2xl font-bold mb-6">Min profil</h1>
        <DancerProfileClient
          userId={user.id}
          name={profile.name}
          phone={profile.phone ?? ""}
          avatarUrl={profile.avatar_url ?? null}
        />
      </div>
    </main>
  );
}
