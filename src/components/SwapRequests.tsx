"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatTime } from "@/lib/dateUtils";

interface IncomingSwap {
  request_id: string;
  requester_id: string;
  requester_name: string;
  requester_start: string;
  my_name: string;
  my_start: string;
  trainer_id: string;
  trainer_name: string;
}

function when(iso: string) {
  const d = new Date(iso);
  return `${formatDate(d, { weekday: "short", day: "numeric", month: "short" })} kl ${formatTime(d)}`;
}

async function notify(userIds: string[], title: string, message: string) {
  const supabase = createClient();
  await supabase.from("notifications").insert(userIds.map(user_id => ({ user_id, message })));
  fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds, title, message }),
  }).catch(() => {});
}

export default function SwapRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<IncomingSwap[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [focusRequested, setFocusRequested] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient().rpc("get_incoming_swaps").then(({ data }) => setRequests((data as IncomingSwap[]) ?? []));
  }, []);

  // Trykk på et bytte-varsel i bjella: rull hit og la boksen blinke
  useEffect(() => {
    if (window.location.search.includes("bytte=1")) setFocusRequested(true);
    const onShow = () => setFocusRequested(true);
    window.addEventListener("danceitude:show-swaps", onShow);
    return () => window.removeEventListener("danceitude:show-swaps", onShow);
  }, []);

  useEffect(() => {
    if (!focusRequested || requests.length === 0) return;
    const t = setTimeout(() => {
      boxRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlight(true);
      setTimeout(() => setHighlight(false), 2500);
      setFocusRequested(false);
      window.history.replaceState(null, "", window.location.pathname);
    }, 150);
    return () => clearTimeout(t);
  }, [focusRequested, requests.length]);

  async function respond(r: IncomingSwap, accept: boolean) {
    if (busy) return;
    setBusy(r.request_id);
    setError("");
    const { error: err } = await createClient().rpc("respond_swap", { p_request: r.request_id, p_accept: accept });
    if (err) { setError(err.message); setBusy(null); return; }

    if (accept) {
      await notify([r.requester_id], "Bytte godtatt",
        `${r.my_name} godtok byttet. Din nye time hos ${r.trainer_name} er ${when(r.my_start)}.`);
      await notify([r.trainer_id], "Timer byttet",
        `${r.requester_name} og ${r.my_name} har byttet timer: ${r.requester_name} har nå ${when(r.my_start)}, ${r.my_name} har nå ${when(r.requester_start)}.`);
    } else {
      await notify([r.requester_id], "Bytte avslått",
        `${r.my_name} avslo bytteforespørselen. Du beholder timen din ${when(r.requester_start)}.`);
    }
    setRequests(prev => prev.filter(x => x.request_id !== r.request_id));
    setBusy(null);
    router.refresh();
  }

  if (requests.length === 0) return null;

  return (
    <div ref={boxRef} className="space-y-2 mt-4 scroll-mt-24">
      {requests.map(r => (
        <div key={r.request_id} className={`bg-white dark:bg-gray-900 rounded-2xl border p-4 transition-all duration-500 ${highlight ? "border-[#c87de0] ring-4 ring-[#E2A9F1]/50 scale-[1.02]" : "border-[#E2A9F1]/60"}`}>
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
            <ArrowLeftRight size={16} className="text-[#c87de0]" /> Bytteforespørsel fra {r.requester_name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5">
            Din time <span className="font-medium">{when(r.my_start)}</span> mot <span className="font-medium">{when(r.requester_start)}</span> hos {r.trainer_name}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => respond(r, true)}
              disabled={!!busy}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-[#3A3A3A] text-[#E2A9F1] disabled:opacity-50"
            >
              {busy === r.request_id ? "…" : "Godta"}
            </button>
            <button
              type="button"
              onClick={() => respond(r, false)}
              disabled={!!busy}
              className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
            >
              Avvis
            </button>
          </div>
        </div>
      ))}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
