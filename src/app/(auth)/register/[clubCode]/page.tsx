import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterWithCodePage({ params }: { params: { clubCode: string } }) {
  const supabase = await createClient();
  const code = params.clubCode.toUpperCase();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, short_name, primary_color")
    .eq("invite_code", code)
    .single();

  if (!club) redirect("/register");

  return <RegisterForm prefilledCode={code} clubName={club.name} />;
}
