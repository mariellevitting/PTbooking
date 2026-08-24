import { NextRequest, NextResponse } from "next/server";

const ONESIGNAL_APP_ID = "b9607f9e-6dbe-49b0-8bcc-edf5f6728575";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY ?? "";

export async function POST(req: NextRequest) {
  const { trainerId, message } = await req.json();

  if (!trainerId || !message) {
    return NextResponse.json({ error: "Missing trainerId or message" }, { status: 400 });
  }

  if (!ONESIGNAL_REST_API_KEY) {
    return NextResponse.json({ error: "Missing OneSignal API key" }, { status: 500 });
  }

  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: [trainerId] },
      target_channel: "push",
      headings: { en: "Ny booking", nb: "Ny booking" },
      contents: { en: message, nb: message },
    }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
