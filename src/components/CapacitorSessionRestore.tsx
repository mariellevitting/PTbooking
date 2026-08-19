"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REDIRECT_ON_SESSION = ["/login", "/register"];

export default function CapacitorSessionRestore() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isCapacitor = typeof window !== "undefined" && !!(window as any).Capacitor;
    if (!isCapacitor) return;

    const shouldRedirect = REDIRECT_ON_SESSION.some(p => pathname === p || pathname.startsWith(p + "/"));
    if (!shouldRedirect) return;

    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role === "trainer") router.replace("/trainer/dashboard");
      else if (profile?.role === "parent") router.replace("/parent/dashboard");
      else router.replace("/dancer/dashboard");
    });
  }, [pathname]);

  return null;
}
