"use client";

import { AlertTriangle, CheckCircle2, Inbox, Loader2, RefreshCw, X } from "lucide-react";
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-ink-100 bg-white p-5 sm:p-6", className)}>{children}</section>;
}

export function CardTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-ink-900">{children}</h2>
      {hint && <p className="mt-0.5 text-sm text-ink-500">{hint}</p>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5" data-stat={label}>
      <p className="text-sm text-ink-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-ink-900 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

const PILL_TONES = {
  green: "bg-brand-50 text-brand-800 ring-brand-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  blue: "bg-sky-50 text-sky-800 ring-sky-200",
  gray: "bg-ink-50 text-ink-600 ring-ink-200",
} as const;
export type Tone = keyof typeof PILL_TONES;

export function Pill({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", PILL_TONES[tone])}>{children}</span>;
}

export function Meter({ share, tone = "green", label }: { share: number; tone?: "green" | "amber" | "red"; label: string }) {
  const width = `${Math.round(Math.max(0, Math.min(1, share)) * 100)}%`;
  const color = { green: "bg-brand-500", amber: "bg-amber-400", red: "bg-red-500" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={parseInt(width)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width }} />
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "danger" | "ghost"; busy?: boolean };

export function Button({ variant = "outline", busy = false, className, children, disabled, ...props }: ButtonProps) {
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    outline: "border border-ink-200 bg-white text-ink-900 hover:bg-ink-50",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
    ghost: "text-ink-600 hover:bg-ink-50",
  }[variant];
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={cn("inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50", styles, className)}
      {...props}
    >
      {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Loading({ what = "Loading" }: { what?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-ink-500" role="status" aria-live="polite">
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      <span>{what}…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6" role="alert">
      <p className="flex items-start gap-2 font-semibold text-red-800">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        This could not be loaded
      </p>
      <p className="mt-1 pl-7 text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="ml-7 mt-4">
          <RefreshCw className="size-4" aria-hidden="true" /> Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-10 text-center">
      <Inbox className="mx-auto size-8 text-ink-300" aria-hidden="true" />
      <p className="mt-3 font-semibold text-ink-900">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-ink-500">{children}</div>}
    </div>
  );
}

export type Notice = { kind: "success" | "error"; text: string } | null;

/** A result message for an action the person just took. Success messages clear themselves. */
export function NoticeBar({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  useEffect(() => {
    if (notice?.kind !== "success") return;
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [notice, onClose]);
  if (!notice) return null;
  const success = notice.kind === "success";
  return (
    <div
      role={success ? "status" : "alert"}
      className={cn("flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium", success ? "border-brand-200 bg-brand-50 text-brand-800" : "border-red-200 bg-red-50 text-red-800")}
    >
      {success ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      <span className="flex-1">{notice.text}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="rounded p-0.5 hover:bg-black/5">
        <X className="size-4" />
      </button>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th scope="col" className={cn("px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-3 align-top text-sm text-ink-700", className)}>{children}</td>;
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-ink-100"><table className="w-full min-w-[36rem] border-collapse">{children}</table></div>;
}
