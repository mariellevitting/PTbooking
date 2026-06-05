import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function KvitteringPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Booket!</h1>
        <p className="text-gray-500 mb-8">Timen er bekreftet. Treneren får beskjed.</p>
        <Link href="/dancer/dashboard">
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            Tilbake til mine timer
          </Button>
        </Link>
      </div>
    </main>
  );
}
