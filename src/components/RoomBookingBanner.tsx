"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useHasRooms } from "@/lib/useHasRooms";

interface Props {
  clubId: string | null;
  href?: string;
  label?: string;
  className?: string;
}

// Vises kun for klubber som har satt opp saler (foreløpig kun Moveon).
// Gjør ingenting synlig for klubber uten saler.
export default function RoomBookingBanner({ clubId, href = "/sal", label = "Book sal", className = "" }: Props) {
  const hasRooms = useHasRooms(clubId);

  if (!hasRooms) return null;

  return (
    <Link href={href} className={className}>
      <Button variant="outline" className="w-full border-[#3A3A3A] dark:border-[#c87de0] text-[#3A3A3A] dark:text-[#c87de0]">
        {label}
      </Button>
    </Link>
  );
}
