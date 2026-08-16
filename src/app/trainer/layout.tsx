import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TrainerSidebar from "@/components/TrainerSidebar";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <TrainerSidebar
        name={profile.name}
        userId={user.id}
        email={user.email ?? ""}
        avatarUrl={profile.avatar_url ?? null}
        notifications={notifications ?? []}
      />
      <div className="flex-1 md:ml-56 pt-[calc(4.5rem+env(safe-area-inset-top))] md:pt-0">
        {children}
      </div>
    </div>
  );
}
