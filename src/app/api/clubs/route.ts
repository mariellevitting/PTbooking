import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.toUpperCase();

  if (!code) return NextResponse.json({ error: "Mangler kode" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, short_name")
    .eq("invite_code", code)
    .single();

  if (!club) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });

  return NextResponse.json(club);
}
