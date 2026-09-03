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

  const { name, shortName, inviteCode } = await req.json();
  const code = String(inviteCode ?? "").trim().toUpperCase();
  if (!name || !code) {
    return NextResponse.json({ error: "Mangler navn eller klubbkode" }, { status: 400 });
  }
  if (!/^[A-Z0-9-]+$/.test(code)) {
    return NextResponse.json({ error: "Klubbkode kan bare inneholde bokstaver, tall og bindestrek" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Konfigurasjonsfeil" }, { status: 500 });
  }

  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin
    .from("clubs")
    .insert({ name: String(name).trim(), short_name: shortName?.trim() || null, invite_code: code })
    .select("id")
    .single();

  if (error) {
    const msg = error.code === "23505" ? "Klubbkoden er allerede i bruk" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
