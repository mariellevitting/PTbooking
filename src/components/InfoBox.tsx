"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";

export default function InfoBox() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 text-sm text-[#E2A9F1] hover:text-purple-800 font-medium"
      >
        <Info size={16} />
        Om privattimer
      </button>

      {open && (
        <div className="mt-3 bg-[#f5eeff] dark:bg-[#E2A9F1]/10 border border-[#E2A9F1]/30 rounded-2xl p-4 space-y-3 relative">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 text-gray-400 dark:text-gray-500 hover:text-gray-600"
          >
            <X size={16} />
          </button>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Evolutions instruktører tilbyr privattimer – koreografi, teknikk, akrobatikk o.l.
            En privattime varer <strong>30 minutter</strong> og koster <strong>250,-</strong>, <strong>200,-</strong> eller <strong>150,-</strong> avhengig av trener.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700 mb-0.5">Betaling</p>
            <p className="text-xs text-blue-600">Betaling er som før i <strong>Spond</strong>.</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-700 mb-0.5">VIKTIG</p>
            <p className="text-xs text-amber-600">Husk kvittering for betalt privattime til timen!</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-green-700 mb-0.5">Booking samme dag?</p>
            <p className="text-xs text-green-600">Gi treneren beskjed på forhånd samme dag via melding (Messenger, Snapchat e.l.) så de er forberedt. 💬</p>
          </div>
        </div>
      )}
    </div>
  );
}
