"use client";

import Link from "next/link";
import { ChevronRight, Pin } from "lucide-react";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { togglePin } from "./actions";

type Trainer = {
  id: string;
  name: string;
  avatarUrl: string | null;
  styles: string[];
  isPinned: boolean;
  price: number;
  priceDouble: number | null;
  availableSlots: number;
};

function TrainerCard({ trainer }: { trainer: Trainer }) {
  const t = useTranslations("book");
  const [pending, startTransition] = useTransition();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4 hover:border-[#E2A9F1] hover:shadow-sm transition-all flex items-center gap-4">
      <button
        onClick={() => startTransition(() => togglePin(trainer.id, trainer.isPinned))}
        disabled={pending}
        className="shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={trainer.isPinned ? t("removePin") : t("pinTrainer")}
      >
        <Pin
          size={16}
          className={trainer.isPinned ? "text-[#E2A9F1] fill-[#3A3A3A]" : "text-gray-300 dark:text-gray-600"}
        />
      </button>
      <Link href={`/book/${trainer.id}`} className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-full bg-[#edd5f9] dark:bg-[#E2A9F1]/15 flex items-center justify-center text-[#E2A9F1] font-bold text-lg shrink-0 overflow-hidden">
          {trainer.avatarUrl
            ? <img src={trainer.avatarUrl} alt={trainer.name} className="w-full h-full object-cover" />
            : trainer.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{trainer.name}</p>
          {trainer.styles.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{trainer.styles.join(" · ")}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 text-right">
          <div>
            <p className="text-sm font-semibold text-[#E2A9F1]">{trainer.priceDouble && trainer.priceDouble !== trainer.price ? t("fromPrice", { price: trainer.price }) : t("price", { price: trainer.price })}</p>
            <p className="text-xs text-gray-400">{trainer.availableSlots > 0 ? t("slotsAvailable", { count: trainer.availableSlots }) : t("noSlotsAvailable")}</p>
          </div>
          <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
        </div>
      </Link>
    </div>
  );
}

export default function TrainerList({ trainers }: { trainers: Trainer[] }) {
  const t = useTranslations("book");
  const pinned = trainers.filter(tr => tr.isPinned);
  const rest = trainers.filter(tr => !tr.isPinned);

  return (
    <div className="space-y-6">
      {pinned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{t("pinnedTrainers")}</p>
          <div className="space-y-3">
            {pinned.map(tr => <TrainerCard key={tr.id} trainer={tr} />)}
          </div>
        </div>
      )}
      <div>
        {pinned.length > 0 && (
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{t("allTrainers")}</p>
        )}
        <div className="space-y-3">
          {rest.map(tr => <TrainerCard key={tr.id} trainer={tr} />)}
        </div>
      </div>
    </div>
  );
}
