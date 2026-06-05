import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ChildrenForm from "./ChildrenForm";

export default async function ParentProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") redirect("/dashboard");

  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("parent_id", user.id)
    .order("created_at");

  return (
    <main className="bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <Link href="/parent/dashboard" className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline mb-6">
          <ArrowLeft size={16} /> Tilbake
        </Link>
        <h1 className="text-2xl font-bold mb-6">Mine dansere</h1>
        <ChildrenForm parentId={user.id} children={children ?? []} />
      </div>
    </main>
  );
}
