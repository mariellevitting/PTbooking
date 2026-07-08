import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function KvitteringPage() {
  return (
    <main className="bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Booket!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Timen er bekreftet. Treneren får beskjed.</p>

        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 mb-8 text-left">
          <p className="text-sm text-purple-700 font-medium mb-1">Husk til timen</p>
          <p className="text-sm text-purple-600">
            Husk å komme oppvarmet til privattimen! Gleder meg til å se deg 🌟
          </p>
        </div>

        <Link href="/dancer/dashboard">
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            Tilbake til mine timer
          </Button>
        </Link>
      </div>
    </main>
  );
}
