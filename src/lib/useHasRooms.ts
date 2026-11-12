"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Sant hvis klubben har satt opp saler til egentrening (foreløpig kun Moveon).
export function useHasRooms(clubId: string | null | undefined) {
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

  return hasRooms;
}
