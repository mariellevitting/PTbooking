import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const isCapacitor = typeof window !== "undefined" && !!(window as any).Capacitor;
  if (isCapacitor) {
    const { capacitorStorage } = require("./capacitor-storage");
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storage: capacitorStorage,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      }
    );
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
