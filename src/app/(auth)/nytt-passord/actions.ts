"use server";

import { createClient } from "@/lib/supabase/server";

export async function updatePassword(password: string, code?: string) {
  const supabase = await createClient();

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) return { error: "Lenken er utløpt. Be om ny lenke." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("updateUser error:", error.message, error.code);
    return { error: error.message };
  }
  return { error: null };
}
