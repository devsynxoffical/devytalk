"use client";

/**
 * The application's component library ("Ledger").
 *
 * Structure comes from hairlines and alignment, not from boxes: a Panel is used only
 * where a group of content needs its own surface. Every colour, radius and type size
 * comes from the tokens in globals.css.
 */

import { AlertTriangle, ArrowDown, ArrowUp, Check, ChevronDown, CircleAlert, Info, Loader2, RefreshCw, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type Tone = "pos" | "warn" | "crit" | "info" | "neutral";

// Text stays black whatever the state; the marker beside it carries the colour.
const TONE_TEXT: Record<Tone, string> = { pos: "text-fg", warn: "text-fg", crit: "text-fg", info: "text-fg", neutral: "text-fg-2" };
const TONE_DOT: Record<Tone, string> = { pos: "bg-pos-mark", warn: "bg-warn-mark", crit: "bg-crit-mark", info: "bg-info-mark", neutral: "bg-fg-3" };
const TONE_SOFT: Record<Tone, string> = { pos: "bg-pos-bg text-fg", warn: "bg-warn-bg text-fg", crit: "bg-crit-bg text-fg", info: "bg-info-bg text-fg", neutral: "bg-sunken text-fg" };

// ----------------------------------------------------------------------------- actions

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md"; busy?: boolean };

export function buttonClass(variant: NonNullable<ButtonProps["variant"]> = "secondary", size: NonNullable<ButtonProps["size"]> = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-control font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-100 active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
    size === "sm" ? "h-7 px-2.5 text-[12.5px]" : "h-9 px-3.5 text-[13.5px] max-sm:h-10",
    {
      primary: "bg-signal text-on-signal hover:bg-accent-strong",
      secondary: "border border-line-strong bg-surface text-fg hover:border-fg hover:bg-sunken",
      ghost: "text-fg-2 hover:bg-sunken hover:text-fg",
      danger: "border border-crit/35 bg-surface text-crit hover:bg-crit-bg",
    }[variant],
    className,
  );
}

export function Button({ variant = "secondary", size = "md", busy = false, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button type="button" disabled={disabled || busy} aria-busy={busy || undefined} className={buttonClass(variant, size, className)} {...props}>
      {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

// ----------------------------------------------------------------------------- status and labels

/** A state, as a small square marker and a word. Colour never carries the meaning alone. */
export function Status({ tone = "neutral", children, live = false }: { tone?: Tone; children: ReactNode; live?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12.5px] font-medium whitespace-nowrap", TONE_TEXT[tone])}>
      <span className={cn("size-2 rounded-[2px]", live ? "animate-live bg-signal" : TONE_DOT[tone])} aria-hidden="true" />
      {children}
    </span>
  );
}

/** A compact label for a category or a count. */
export function Tag({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn("inline-flex h-5 items-center rounded-chip px-1.5 text-[11.5px] font-medium whitespace-nowrap", TONE_SOFT[tone])}>{children}</span>;
}

// ----------------------------------------------------------------------------- surfaces

export function Panel({ title, description, actions, children, className, flush = false, id }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string; flush?: boolean; id?: string }) {
  return (
    <section id={id} className={cn("rounded-panel border border-line bg-surface", className)}>
      {(title || actions) && (
        <header className={cn("flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 py-3", children !== null && children !== undefined && children !== false && "border-b border-line")}>
          <div className="min-w-0">
            {title && <h2 className="t-section text-fg">{title}</h2>}
            {description && <p className="t-meta mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex min-w-0 max-w-full items-center gap-2">{actions}</div>}
        </header>
      )}
      {children !== null && children !== undefined && children !== false && <div className={flush ? "" : "p-4"}>{children}</div>}
    </section>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {eyebrow && <p className="t-eyebrow mb-1">{eyebrow}</p>}
        <h1 className="t-title text-fg">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[13.5px] text-fg-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * Headline figures in one band divided by hairlines: read across like a ledger line,
 * instead of a grid of separate cards. Wraps to two columns on phones.
 */
export function MetricStrip({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line xl:auto-cols-fr xl:grid-flow-col xl:grid-cols-none", className)}>{children}</div>;
}

export function Metric({ label, value, total, note, aside, testId, wide = false }: { label: string; value: ReactNode; total?: ReactNode; note?: ReactNode; aside?: ReactNode; testId?: string; wide?: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-center justify-between gap-3 bg-surface px-4 py-3.5", wide && "max-xl:col-span-2")} data-stat={label} data-testid={testId}>
      <div className="min-w-0">
        <p className="t-eyebrow sm:truncate">{label}</p>
        <p className="t-metric mt-1.5 text-fg">
          {value}
          {total !== undefined && <span className="ml-1 text-[13px] font-normal tracking-normal text-fg-3">/ {total}</span>}
        </p>
        {note && <p className="t-meta mt-1 line-clamp-2">{note}</p>}
      </div>
      {aside && <div className="shrink-0 max-sm:hidden">{aside}</div>}
    </div>
  );
}

export function KeyValues({ rows, className }: { rows: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <dl className={cn("divide-y divide-line", className)}>
      {rows.map(([key, value], i) => (
        <div key={i} className="flex items-baseline justify-between gap-6 py-2 text-[13px]">
          <dt className="text-fg-3">{key}</dt>
          <dd className="text-right font-medium text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ----------------------------------------------------------------------------- feedback

const BANNER_ICON: Record<Tone, typeof Info> = { pos: Check, warn: AlertTriangle, crit: CircleAlert, info: Info, neutral: Info };

export function Banner({ tone = "info", title, children, role, testId, actions }: { tone?: Tone; title: ReactNode; children?: ReactNode; role?: "status" | "alert"; testId?: string; actions?: ReactNode }) {
  const Icon = BANNER_ICON[tone];
  return (
    <div role={role} data-testid={testId} className={cn("flex items-start gap-3 rounded-panel px-4 py-3", TONE_SOFT[tone])}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", tone === "crit" && "text-crit")} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-[13px]">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-0.5 text-fg-2">{children}</div>}
      </div>
      {actions}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-3", className)} aria-hidden="true" />;
}

/** A placeholder in the shape of what is coming: a strip of figures and some rows. */
export function Loading({ what = "Loading", rows = 5, strip = true }: { what?: string; rows?: number; strip?: boolean }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">{what}…</span>
      {strip && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2.5 bg-surface px-4 py-4">
              <Skeleton className="w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      )}
      <div className="rounded-panel border border-line bg-surface">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0">
            <Skeleton className="w-1/4" />
            <Skeleton className="w-1/6" />
            <Skeleton className="ml-auto w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-panel border border-crit/25 bg-crit-bg px-4 py-4" role="alert">
      <p className="flex items-center gap-2 text-[13.5px] font-semibold text-fg">
        <CircleAlert className="size-4 shrink-0 text-crit" aria-hidden="true" />
        This could not be loaded
      </p>
      <p className="mt-1 pl-6 text-[13px] text-fg-2">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} size="sm" className="ml-6 mt-3">
          <RefreshCw className="size-3.5" aria-hidden="true" /> Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-panel border border-dashed border-line-strong px-6 py-10 text-center">
      <p className="t-section text-fg">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-[13px] text-fg-2">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export type Notice = { kind: "success" | "error"; text: string } | null;

/** The result of an action the person just took, as a toast. Success clears itself; an error stays until dismissed. */
export function NoticeBar({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  useEffect(() => {
    if (notice?.kind !== "success") return;
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [notice, onClose]);
  if (!notice) return null;
  const success = notice.kind === "success";
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-[70] flex justify-center px-4 md:bottom-6 md:justify-end md:px-6">
      <div role={success ? "status" : "alert"} className="pointer-events-auto flex max-w-md animate-rise items-start gap-2.5 rounded-overlay border border-line-strong bg-surface px-4 py-3 text-[13px] text-fg shadow-overlay">
        {success ? <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-signal"><Check className="size-3 text-on-signal" aria-hidden="true" /></span> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-crit" aria-hidden="true" />}
        <span className="flex-1">{notice.text}</span>
        <button type="button" onClick={onClose} aria-label="Dismiss" className="-mr-1 rounded p-0.5 text-fg-3 hover:text-fg">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** "Are you sure" in place, where the action is: what will happen, a confirm and a way back. */
export function Confirm({ label, children, confirmLabel, tone = "primary", busy, onConfirm, onCancel, error }: { label: string; children: ReactNode; confirmLabel: string; tone?: "primary" | "danger"; busy?: boolean; onConfirm: () => void; onCancel: () => void; error?: string | null }) {
  return (
    <div role="group" aria-label={label} className="animate-rise rounded-control border border-line bg-sunken p-3">
      <div className="text-[13px] text-fg-2">{children}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant={tone} busy={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-[13px] font-medium text-crit" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------- forms

const CONTROL =
  "w-full rounded-control border border-line-strong bg-surface px-2.5 text-[13.5px] text-fg placeholder:text-fg-3 placeholder:[font-family:var(--font-app)] placeholder:tracking-normal transition-[border-color,box-shadow] duration-100 hover:border-fg-3 focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/25 disabled:bg-sunken disabled:text-fg-3 max-sm:text-[16px]";

export function Field({ label, hint, error, children, className }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {/* Help and error text sit outside the label, so the field's name is its label alone. */}
      <label className="block">
        <span className="mb-1 block text-[12.5px] font-medium text-fg-2">{label}</span>
        {children}
      </label>
      {error ? <p role="alert" className="mt-1 text-[12px] font-medium text-crit">{error}</p> : hint ? <p className="t-meta mt-1">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, "h-9 max-sm:h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, "py-2", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select className={cn(CONTROL, "h-9 appearance-none pr-8 max-sm:h-11", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-3" aria-hidden="true" />
    </span>
  );
}

/** A few mutually exclusive choices, all visible. */
export function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: [T, string][]; value: T; onChange: (value: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-control border border-line-strong bg-surface p-0.5">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn("h-7 rounded-[3px] px-2.5 text-[12.5px] font-medium whitespace-nowrap transition-colors max-sm:h-9 max-sm:px-3", value === key ? "bg-signal text-on-signal" : "text-fg-2 hover:bg-sunken")}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------- data

export function Meter({ share, tone = "pos", label }: { share: number; tone?: Tone; label: string }) {
  const percent = Math.round(Math.max(0, Math.min(1, share)) * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", TONE_DOT[tone])} style={{ width: `${percent}%`, minWidth: percent > 0 ? 3 : 0 }} />
    </div>
  );
}

export type Column<T> = {
  key: string;
  label: string;
  /** Right-aligned figures in the tabular face. */
  numeric?: boolean;
  /** The row's name: shown first and larger on phones. */
  primary?: boolean;
  /** Give a value to make the column sortable. */
  sortValue?: (row: T) => string | number | null;
  render: (row: T) => ReactNode;
  className?: string;
};

/**
 * A table on wide screens, a list of labelled records on phones (see `.dt` in
 * globals.css). Sorting is by clicking a column heading; the sorted column is announced.
 */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, caption, initialSort, testId, mobileRow }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string | number; onRowClick?: (row: T) => void; caption: string; initialSort?: { key: string; descending: boolean }; testId?: string; /** A compact row designed for phones. Without it, rows become labelled records. */ mobileRow?: (row: T) => ReactNode }) {
  const [sort, setSort] = useState(initialSort ?? null);
  const sorted = useMemo(() => {
    const column = sort && columns.find((c) => c.key === sort.key);
    if (!sort || !column?.sortValue) return rows;
    const value = column.sortValue;
    return [...rows].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1; // rows with no value go last either way
      const order = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.descending ? -order : order;
    });
  }, [rows, sort, columns]);

  return (
    <>
    {mobileRow && (
      <ul className="divide-y divide-line sm:hidden" aria-label={caption}>
        {sorted.map((row) => (
          <li key={rowKey(row)}>
            {onRowClick ? (
              <button type="button" onClick={() => onRowClick(row)} className="block w-full px-4 py-3 text-left active:bg-sunken">
                {mobileRow(row)}
              </button>
            ) : (
              <div className="px-4 py-3">{mobileRow(row)}</div>
            )}
          </li>
        ))}
      </ul>
    )}
    <table className={cn("dt", mobileRow && "max-sm:hidden")} data-testid={testId}>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => {
            const active = sort?.key === column.key;
            return (
              <th key={column.key} scope="col" className={cn(column.numeric && "num", column.className)} aria-sort={active ? (sort.descending ? "descending" : "ascending") : undefined}>
                {column.sortValue ? (
                  <button
                    type="button"
                    onClick={() => setSort(active ? { key: column.key, descending: !sort.descending } : { key: column.key, descending: Boolean(column.numeric) })}
                    className={cn("inline-flex items-center gap-1 uppercase tracking-[0.06em] hover:text-fg", active && "text-fg")}
                  >
                    {column.label}
                    {active ? sort.descending ? <ArrowDown className="size-3" aria-hidden="true" /> : <ArrowUp className="size-3" aria-hidden="true" /> : null}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => (
          <tr key={rowKey(row)} data-clickable={onRowClick ? "true" : undefined} onClick={onRowClick ? () => onRowClick(row) : undefined}>
            {columns.map((column) => (
              <td key={column.key} data-label={column.label} data-primary={column.primary ? "true" : undefined} className={cn(column.numeric && "num", column.className)}>
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    </>
  );
}

// ----------------------------------------------------------------------------- overlays

/** A side panel on wide screens, a sheet that rises from the bottom on phones. */
export function Drawer({ label, title, subtitle, onClose, children, footer }: { label: string; title: ReactNode; subtitle?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const panel = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-end md:items-stretch">
      <div className="absolute inset-0 animate-fade bg-fg/35" onClick={onClose} aria-hidden="true" />
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-describedby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full flex-col rounded-t-overlay bg-surface shadow-overlay outline-none max-md:animate-sheet-up md:max-h-none md:w-[32rem] md:animate-slide-in md:rounded-none md:border-l md:border-line"
      >
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-line-strong md:hidden" aria-hidden="true" />
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0" id={titleId}>
            <h2 className="t-title truncate text-fg">{title}</h2>
            {subtitle && <p className="t-meta mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1.5 rounded-control p-1.5 text-fg-3 hover:bg-sunken hover:text-fg">
            <X className="size-[18px]" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
        {footer && <footer className="border-t border-line px-5 py-3 pb-safe">{footer}</footer>}
      </aside>
    </div>
  );
}
