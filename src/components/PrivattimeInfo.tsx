import type { ClubConfig } from "@/lib/club";
import { CLUB_DEFAULTS } from "@/lib/club";
import { renderBold } from "@/lib/richText";

/**
 * "Bestille privattimer"-kortet. Alt innhold kommer fra klubb-konfig
 * (clubs-tabellen). Brukes på danser- og forelder-dashboardet.
 */
export default function PrivattimeInfo({ club }: { club: ClubConfig | null }) {
  const duration = club?.lesson_duration_min ?? CLUB_DEFAULTS.lesson_duration_min;
  const priceText = club?.lesson_price_text?.trim();
  const info =
    club?.lesson_info?.trim() ||
    "Trenerne tilbyr privattimer – en fin mulighet til å jobbe med teknikk og utvikling med tett oppfølging.";
  const paymentInfo = club?.payment_info?.trim() || CLUB_DEFAULTS.payment_info;
  const receiptNote = club?.receipt_note?.trim();

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-700 p-5 space-y-4">
        <h2 className="text-lg font-bold">Bestille privattimer</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{info}</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          En privattime varer i <strong>{duration} minutter</strong>
          {priceText ? <> og koster {renderBold(priceText)}</> : null}.
        </p>
        <div className="bg-[#f5eeff] border border-[#E2A9F1]/40 rounded-xl p-4">
          <p className="text-sm font-semibold text-[#9b59c4] mb-1">Betaling</p>
          <p className="text-sm text-[#9b59c4]">
            <PaymentText
              info={paymentInfo}
              label={club?.payment_label ?? null}
              url={club?.payment_url ?? null}
            />
          </p>
        </div>
        {receiptNote && (
          <div className="bg-[#f5eeff] border border-[#E2A9F1]/40 rounded-xl p-4">
            <p className="text-sm font-semibold text-[#9b59c4] mb-1">VIKTIG!</p>
            <p className="text-sm text-[#9b59c4]">{receiptNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Rendrer betalingsteksten. En **fet** del blir en lenke hvis klubben har en
 * payment_url; ellers vises den bare i fet skrift. `label` brukes ikke her,
 * men holdes med for kall som allerede sender den.
 */
export function PaymentText({
  info,
  url,
}: {
  info: string;
  label?: string | null;
  url: string | null;
}) {
  if (url && /\*\*[^*]+\*\*/.test(info)) {
    return (
      <>
        {info.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              {part.slice(2, -2)}
            </a>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  }
  return <>{renderBold(info)}</>;
}
