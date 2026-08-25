export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name, invite_code")
    .order("name");

  return <RegisterForm clubs={clubs ?? []} />;
}
