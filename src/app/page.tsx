"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
      setChecking(false);
    });
  }, [router]);

  if (!checking) return null;

  return (
    <div className="min-h-screen bg-[#3A3A3A] flex flex-col items-center justify-center gap-6">
      <svg width="64" height="64" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="18" height="28" rx="3" fill="#E2A9F1"/>
        <rect x="22" y="12" width="18" height="16" rx="3" fill="#E2A9F1"/>
        <rect x="22" y="0" width="18" height="10" rx="3" fill="#E2A9F1"/>
      </svg>
      <p className="text-[#E2A9F1] font-bold tracking-widest text-sm uppercase">Danceitude</p>
    </div>
  );
}
