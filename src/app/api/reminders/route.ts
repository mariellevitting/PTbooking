import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ONESIGNAL_APP_ID = "b9607f9e-6dbe-49b0-8bcc-edf5f6728575";

// Kalles én gang om morgenen (Vercel Cron). Sender "Husk privattime i dag kl …"
// til danser/forelder, den koblede danseren, og treneren – i appen og som push.
export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Dagens dato i Oslo-tid (Vercel kjører i UTC)
  const osloNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Oslo" }));
  const y = osloNow.getFullYear();
  const m = String(osloNow.getMonth() + 1).padStart(2, "0");
  const d = String(osloNow.getDate()).padStart(2, "0");
  // Oslo er UTC+1/+2 – ta et romslig vindu og filtrer nøyaktig etterpå
  const windowStart = new Date(`${y}-${m}-${d}T00:00:00+00:00`);
  windowStart.setUTCDate(windowStart.getUTCDate() - 1);
  const windowEnd = new Date(`${y}-${m}-${d}T00:00:00+00:00`);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + 2);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, booker_id, linked_user_id, dancer_name, availability_slots(start_at, trainer_id)")
    .eq("status", "confirmed")
    .gte("availability_slots.start_at", windowStart.toISOString())
    .lte("availability_slots.start_at", windowEnd.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const osloDateKey = `${y}-${m}-${d}`;
  const todays = (bookings ?? []).filter(b => {
    const slot = Array.isArray(b.availability_slots) ? b.availability_slots[0] : b.availability_slots;
    if (!slot?.start_at) return false;
    const key = new Date(slot.start_at).toLocaleDateString("en-CA", { timeZone: "Europe/Oslo" });
    return key === osloDateKey;
  });

  if (todays.length === 0) {
    return NextResponse.json({ message: "Ingen timer i dag", sent: 0 });
  }

  // Trenernavn
  const trainerIds = [...new Set(todays.map(b => {
    const slot = Array.isArray(b.availability_slots) ? b.availability_slots[0] : b.availability_slots;
    return slot?.trainer_id;
  }).filter(Boolean))] as string[];
  const { data: trainers } = await supabase.from("profiles").select("id, name").in("id", trainerIds);
  const trainerName: Record<string, string> = {};
  for (const t of trainers ?? []) trainerName[t.id] = t.name;

  const notifications: { user_id: string; message: string }[] = [];
  for (const b of todays) {
    const slot = Array.isArray(b.availability_slots) ? b.availability_slots[0] : b.availability_slots;
    if (!slot) continue;
    const time = new Date(slot.start_at).toLocaleTimeString("nb-NO", {
      timeZone: "Europe/Oslo", hour: "2-digit", minute: "2-digit",
    });
    const tName = trainerName[slot.trainer_id] ?? "treneren";

    notifications.push({ user_id: b.booker_id, message: `Husk privattime i dag kl ${time} med ${tName}` });
    if (b.linked_user_id && b.linked_user_id !== b.booker_id) {
      notifications.push({ user_id: b.linked_user_id, message: `Husk privattime i dag kl ${time} med ${tName}` });
    }
    if (slot.trainer_id) {
      notifications.push({ user_id: slot.trainer_id, message: `Husk privattime i dag kl ${time} med ${b.dancer_name}` });
    }
  }

  // Unngå duplikater hvis ruten kjøres flere ganger samme dag
  const { data: existing } = await supabase
    .from("notifications")
    .select("user_id, message")
    .gte("created_at", windowStart.toISOString())
    .ilike("message", "Husk privattime i dag%");
  const seen = new Set((existing ?? []).map(n => `${n.user_id}|${n.message}`));
  const fresh = notifications.filter(n => !seen.has(`${n.user_id}|${n.message}`));

  if (fresh.length === 0) {
    return NextResponse.json({ message: "Allerede sendt", sent: 0 });
  }

  const { error: insertError } = await supabase.from("notifications").insert(fresh);
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Push
  const restKey = process.env.ONESIGNAL_REST_API_KEY;
  let pushed = 0;
  if (restKey) {
    await Promise.all(fresh.map(async n => {
      const res = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${restKey}` },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_aliases: { external_id: [n.user_id] },
          target_channel: "push",
          headings: { en: "Privattime i dag", nb: "Privattime i dag" },
          contents: { en: n.message, nb: n.message },
        }),
      }).catch(() => null);
      if (res?.ok) pushed++;
    }));
  }

  return NextResponse.json({ message: "Varsler sendt", sent: fresh.length, pushed });
}
