import { createClient } from "@supabase/supabase-js";

/**
 * Ren supabase-js-klient med implicit flow, kun for passord-tilbakestilling.
 *
 * @supabase/ssr sin createBrowserClient tvinger flowType: "pkce" (den
 * overstyrer det vi sender inn). PKCE-lenker i e-post virker bare i samme
 * nettleser som ba om lenka. Implicit legger tokens i URL-hashen, som virker
 * på tvers av nettlesere og enheter.
 */
export function createAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        detectSessionInUrl: true,
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
