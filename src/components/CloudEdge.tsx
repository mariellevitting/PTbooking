"use client";

import { useId } from "react";

// Myk, skyformet høyrekant på mobilmenyen. Ligger utenfor menypanelet,
// så den aldri overlapper tekst. Fargen følger panelet (lys/mørk modus).
const RADII = [46, 30, 58, 36, 26, 52, 40, 62, 32, 48];
const HEIGHT = 1600;
// SVG-en starter litt inne i panelet så det ikke blir en synlig søm
const OVERLAP = 3;

function circles(bulge: number) {
  const out: { cx: number; cy: number; r: number }[] = [];
  let y = -10;
  let i = 0;
  while (y < HEIGHT + 40) {
    const r = RADII[i % RADII.length];
    const cy = y + r * 0.8;
    const b = bulge * (0.55 + 0.45 * (r / 62));
    out.push({ cx: -r + b + OVERLAP, cy, r });
    y = cy + r * 0.75;
    i++;
  }
  return out;
}

const CIRCLES = circles(14);

export default function CloudEdge() {
  const id = `cloud-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      aria-hidden="true"
      className="absolute top-0 left-[calc(100%-3px)] h-full w-10 pointer-events-none text-white dark:text-gray-900"
      overflow="hidden"
    >
      <defs>
        <filter id={id} filterUnits="userSpaceOnUse" x={-120} y={-60} width={200} height={HEIGHT + 120}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" />
        </filter>
      </defs>
      <g filter={`url(#${id})`} fill="currentColor">
        <rect x={-80} y={-60} width={80 + OVERLAP + 4} height={HEIGHT + 120} />
        {CIRCLES.map((c, i) => <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />)}
      </g>
    </svg>
  );
}
