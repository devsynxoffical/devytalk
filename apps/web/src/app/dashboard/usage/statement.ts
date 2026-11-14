/** Ledger amounts are exact decimals sent as text. Small ones keep their fractions of a cent. */
export function usd(amount: string | null | undefined): string {
  const value = Number(amount);
  if (amount === null || amount === undefined || amount === "" || !Number.isFinite(value)) return "–";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: Math.abs(value) < 1 ? 4 : 2 }).format(value);
}

/** "2026-11" as a person reads it. */
export function monthName(period: string): string {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month || month > 12) return period;
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
}

const BASIS: Record<string, string> = {
  estimate: "measured here, at the rates in force",
  provider: "the provider's own figures",
  manual: "corrections made by hand",
};
export const basisName = (basis: string) => BASIS[basis] ?? basis;
