import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getClubForUser, CLUB_DEFAULTS } from "@/lib/club";
import { PaymentText } from "@/components/PrivattimeInfo";

export const dynamic = "force-dynamic";

export default async function KvitteringPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const club = user ? await getClubForUser(supabase, user.id) : null;
  const paymentInfo = club?.payment_info?.trim() || CLUB_DEFAULTS.payment_info;

  return (
    <main className="bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Booket!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Timen er bekreftet. Treneren får beskjed.</p>

        <div className="bg-[#f5eeff] dark:bg-[#E2A9F1]/10 border border-[#E2A9F1]/30 rounded-2xl p-4 mb-4 text-left">
          <p className="text-sm text-[#c87de0] font-medium mb-1">Husk til timen</p>
          <p className="text-sm text-[#E2A9F1]">
            Husk å komme oppvarmet til privattimen! Gleder meg til å se deg 🌟
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-8 text-left">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Betaling</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <PaymentText info={paymentInfo} label={club?.payment_label ?? null} url={club?.payment_url ?? null} />
          </p>
        </div>

        <Link href="/dancer/dashboard">
          <Button className="w-full bg-[#3A3A3A] hover:bg-[#2a2a2a] dark:bg-[#c87de0] dark:hover:bg-[#b56fd0] dark:text-white">
            Tilbake til mine timer
          </Button>
        </Link>
      </div>
    </main>
  );
}
