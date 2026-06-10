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
        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors"
      >
        <Minus size={18} className="text-gray-600" />
      </button>
      <span className="text-xl font-bold text-gray-800 w-8 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-10 h-10 rounded-full bg-purple-100 hover:bg-purple-200 active:bg-purple-300 flex items-center justify-center transition-colors"
      >
        <Plus size={18} className="text-purple-600" />
      </button>
      <span className="text-xs text-gray-500">poeng dette nivået</span>
    </div>
  );
}
