import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ONESIGNAL_APP_ID = "b9607f9e-6dbe-49b0-8bcc-edf5f6728575";

// Generisk push til gitte bruker-IDer. Kalles fra innloggede sider.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

  const { userIds, title, message } = await req.json();
  if (!Array.isArray(userIds) || userIds.length === 0 || !message) {
    return NextResponse.json({ error: "Mangler userIds eller message" }, { status: 400 });
  }

  const restKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!restKey) return NextResponse.json({ ok: true, pushed: 0 });

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${restKey}` },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: userIds },
      target_channel: "push",
      headings: { en: title || "Danceitude", nb: title || "Danceitude" },
      contents: { en: message, nb: message },
    }),
  }).catch(() => null);

  return NextResponse.json({ ok: !!res?.ok });
}
