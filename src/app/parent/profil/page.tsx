import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import UserProfileForm from "@/components/UserProfileForm";
import ChildrenForm from "./ChildrenForm";
import ChildDancerCard from "./ChildDancerCard";

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
    <main className="bg-gray-50 dark:bg-gray-950 px-6 pb-6 page-safe-top">
      <div className="max-w-lg mx-auto">
        <Link href="/parent/dashboard" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-[#E2A9F1]/20 text-gray-700 dark:text-gray-200 mb-2 -ml-2">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </Link>
        <h1 className="text-2xl font-bold mb-6">Min profil</h1>
        <div className="space-y-6">
          <UserProfileForm
            userId={user.id}
            name={profile.name}
            phone={profile.phone ?? ""}
            avatarUrl={profile.avatar_url ?? null}
          />
          <ChildrenForm parentId={user.id} children={(children ?? []).map(c => ({ id: c.id, name: c.name }))} />
          {children && children.length > 0 && (
            <ChildDancerCard parentId={user.id} children={children} />
          )}
        </div>
      </div>
    </main>
  );
}
