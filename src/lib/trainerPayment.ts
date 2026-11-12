/**
 * Enkelte klubber (f.eks. Moveon) har ulik betalingsmåte per trener i
 * stedet for én felles for hele klubben. `trainers.payment_method` /
 * `payment_value` overstyrer klubbens generelle betalingstekst når satt.
 */
export function trainerPaymentInfo(
  method: string | null | undefined,
  value: string | null | undefined
): { label: string; info: string } | null {
  const v = value?.trim();
  if (!v) return null;
  if (method === "bank") return { label: "Bankkonto", info: `Betal til kontonummer **${v}**` };
  return { label: "Vipps", info: `Betal på Vipps til **${v}**` };
}
