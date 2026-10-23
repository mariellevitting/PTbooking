// Blink med pil, tegnet i samme stil som lucide-ikonene (24x24, strek = currentColor)
export default function TargetArrowIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M17.6 9.1A8.5 8.5 0 1 1 13.4 4.9" />
      <path d="M14.3 11.6A4 4 0 1 1 11 9.1" />
      <circle cx="10.5" cy="13.5" r="1.2" fill="currentColor" />
      <path d="M10.5 13.5 19 5" />
      <path d="M17 3.5v3.5h3.5l2-2h-2.5V2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}
