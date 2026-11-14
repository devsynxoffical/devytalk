/** Display helpers for dashboard numbers. A missing value is shown as a dash, never as zero. */

export const DASH = "–";

export function percent(value: number | null | undefined, digits = 1): string {
  return value === null || value === undefined ? DASH : `${(value * 100).toFixed(digits)}%`;
}

export function money(value: number | null | undefined): string {
  if (value === null || value === undefined) return DASH;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(value);
}

export function count(value: number | null | undefined): string {
  return value === null || value === undefined ? DASH : new Intl.NumberFormat("en-US").format(value);
}

/** "not_interested" -> "Not interested" */
export function label(value: string | null | undefined): string {
  if (!value) return DASH;
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const LANGUAGES: Record<string, string> = { en: "English", ar: "Arabic", fr: "French", unknown: "Not detected" };
export function languageName(code: string): string {
  return LANGUAGES[code] ?? code;
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return DASH;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function duration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return DASH;
  const m = Math.floor(seconds / 60);
  return `${m}:${String(seconds % 60).padStart(2, "0")}`;
}

/** A file size as people read it: 840 B, 12 KB, 3.4 MB. */
export function fileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return DASH;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Budget use for a progress bar: spent, remaining and the share used (capped at 100%). */
export function budgetUse(spend: number, budget: number | null): { remaining: number; share: number } | null {
  if (budget === null || budget <= 0) return null;
  return { remaining: Math.max(0, budget - spend), share: Math.min(1, spend / budget) };
}

export const FACTOR_LABELS: Record<string, string> = {
  fits_target_customer: "Fits the target customer",
  has_need: "Has a relevant need",
  decision_maker: "Is the decision-maker",
  timeline: "Buying timeline",
  budget_fit: "Budget fits",
  expressed_interest: "Expressed interest",
};
