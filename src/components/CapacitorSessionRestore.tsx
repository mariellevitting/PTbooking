"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PUBLIC = ["/login", "/register", "/glemt-passord", "/nytt-passord", "/", "/om", "/privacy", "/support"];

export default function CapacitorSessionRestore() {
  const router = useRouter();
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const isCapacitor = typeof window !== "undefined" && !!(window as any).Capacitor;
    if (!isCapacitor) return;

    const isPublic = PUBLIC.some(p => pathname === p || pathname.startsWith(p + "/"));
    if (!isPublic) return;

    setShowSplash(true);
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setShowSplash(false); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role === "trainer") router.replace("/trainer/dashboard");
      else if (profile?.role === "parent") router.replace("/parent/dashboard");
      else router.replace("/dancer/dashboard");
    });
  }, [pathname]);

  if (!showSplash) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A3A3A]">
      <p className="text-3xl font-bold text-[#E2A9F1] tracking-tight">Danceitude</p>
    </div>
  );
}
