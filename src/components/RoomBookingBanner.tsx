"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface Props {
  clubId: string | null;
  href?: string;
  label?: string;
  className?: string;
}

// Vises kun for klubber som har satt opp saler (foreløpig kun Moveon).
// Gjør ingenting synlig for klubber uten saler.
export default function RoomBookingBanner({ clubId, href = "/sal", label = "Book sal", className = "" }: Props) {
  const [hasRooms, setHasRooms] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .then(({ count }) => {
        if (!cancelled) setHasRooms((count ?? 0) > 0);
      });
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  if (!hasRooms) return null;

  return (
    <Link href={href} className={className}>
      <Button variant="outline" className="w-full border-[#3A3A3A] dark:border-[#c87de0] text-[#3A3A3A] dark:text-[#c87de0]">
        {label}
      </Button>
    </Link>
  );
}
