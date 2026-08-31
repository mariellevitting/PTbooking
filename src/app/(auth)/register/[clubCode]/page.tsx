import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterWithCodePage({ params }: { params: Promise<{ clubCode: string }> }) {
  const { clubCode } = await params;
  const code = clubCode.toUpperCase();

  // clubs har RLS-policy "Anyone can read clubs", så anon-klienten holder
  const supabase = await createClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, short_name, primary_color")
    .eq("invite_code", code)
    .single();

  if (!club) redirect("/register");

  return <RegisterForm prefilledCode={code} clubName={club.name} />;
}
