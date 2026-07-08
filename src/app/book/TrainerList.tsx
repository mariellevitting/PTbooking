"use client";

import Link from "next/link";
import { ChevronRight, Pin } from "lucide-react";
import { useTransition } from "react";
import { togglePin } from "./actions";

type Trainer = {
  id: string;
  name: string;
  styles: string[];
  isPinned: boolean;
  price: number;
};

function TrainerCard({ trainer }: { trainer: Trainer }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 p-4 hover:border-purple-400 hover:shadow-sm transition-all flex items-center gap-4">
      <button
        onClick={() => startTransition(() => togglePin(trainer.id, trainer.isPinned))}
        disabled={pending}
        className="shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={trainer.isPinned ? "Fjern pin" : "Fest trener"}
      >
        <Pin
          size={16}
          className={trainer.isPinned ? "text-purple-600 fill-purple-600" : "text-gray-300 dark:text-gray-600"}
        />
      </button>
      <Link href={`/book/${trainer.id}`} className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg shrink-0">
          {trainer.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{trainer.name}</p>
          {trainer.styles.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{trainer.styles.join(" · ")}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold text-purple-600">{trainer.price} kr</span>
          <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
        </div>
      </Link>
    </div>
  );
}

export default function TrainerList({ trainers }: { trainers: Trainer[] }) {
  const pinned = trainers.filter(t => t.isPinned);
  const rest = trainers.filter(t => !t.isPinned);

  return (
    <div className="space-y-6">
      {pinned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Festede trenere</p>
          <div className="space-y-3">
            {pinned.map(t => <TrainerCard key={t.id} trainer={t} />)}
          </div>
        </div>
      )}
      <div>
        {pinned.length > 0 && (
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Alle trenere</p>
        )}
        <div className="space-y-3">
          {rest.map(t => <TrainerCard key={t.id} trainer={t} />)}
        </div>
      </div>
    </div>
  );
}
