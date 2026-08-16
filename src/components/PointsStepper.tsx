"use client";

import { Minus, Plus } from "lucide-react";

interface Props {
  value: number;
  onChange: (val: number) => void;
  min?: number;
}

export default function PointsStepper({ value, onChange, min = 0 }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 flex items-center justify-center transition-colors"
      >
        <Minus size={18} className="text-gray-600 dark:text-gray-400" />
      </button>
      <span className="text-xl font-bold text-gray-800 dark:text-gray-100 w-8 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-10 h-10 rounded-full bg-[#edd5f9] hover:bg-[#E2A9F1]/30 active:bg-[#E2A9F1]/50 flex items-center justify-center transition-colors"
      >
        <Plus size={18} className="text-[#E2A9F1]" />
      </button>
    </div>
  );
}
