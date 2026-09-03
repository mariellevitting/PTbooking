import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = "miemarielle@live.no";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
  }

  const { name, shortName } = await req.json();
  const cleanName = String(name ?? "").trim();
  if (!cleanName) {
    return NextResponse.json({ error: "Mangler klubbnavn" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Konfigurasjonsfeil" }, { status: 500 });
  }

  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Lag en unik lenke-kode automatisk fra navnet (kan endres senere)
  const base = cleanName.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "KLUBB";
  const { data: existing } = await admin.from("clubs").select("invite_code");
  const taken = new Set((existing ?? []).map(c => c.invite_code));
  let code = base;
  for (let i = 2; taken.has(code); i++) code = `${base}-${i}`;

  const { data, error } = await admin
    .from("clubs")
    .insert({ name: cleanName, short_name: shortName?.trim() || null, invite_code: code })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, id: data.id });
}
