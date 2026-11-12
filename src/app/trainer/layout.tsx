import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TrainerSidebar from "@/components/TrainerSidebar";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, avatar_url, club_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "trainer") redirect("/dashboard");

  const [{ data: notifications }, { count: roomCount }, { data: club }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("club_id", (profile as any).club_id ?? ""),
    supabase
      .from("clubs")
      .select("logo_url")
      .eq("id", (profile as any).club_id ?? "")
      .single(),
  ]);

  return (
    <div className="min-h-screen">
      <TrainerSidebar
        name={profile.name}
        userId={user.id}
        email={user.email ?? ""}
        avatarUrl={profile.avatar_url ?? null}
        notifications={notifications ?? []}
        hasRooms={(roomCount ?? 0) > 0}
        logoUrl={(club as any)?.logo_url ?? null}
      />
      <div className="topbar-offset md:ml-56 pt-[calc(4.5rem+env(safe-area-inset-top))] md:pt-0">
        {children}
      </div>
    </div>
  );
}
