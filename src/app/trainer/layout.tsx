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
    .select("id, read")
    .eq("user_id", user.id)
    .eq("read", false);

  const unreadCount = notifications?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TrainerSidebar
        name={profile.name}
        avatarUrl={profile.avatar_url ?? null}
        unreadCount={unreadCount}
      />
      {/* Innhold – skyv til høyre for sidebar på desktop, legg til padding under for mobilnav */}
      <div className="flex-1 md:ml-56 pb-20 md:pb-0">
        {children}
      </div>
    </div>
  );
}
