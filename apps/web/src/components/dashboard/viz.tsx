"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Colours for data marks. Text never wears these: numbers and labels stay in ink, and a
 * coloured mark beside them carries identity.
 *
 * SERIES: three hues that stay distinguishable for colour-blind readers when shown
 * together (checked pairwise on the white card surface). Each has a light step of its
 * own hue for the unfilled part of a meter.
 * STATUS: reserved for state (good, warning, critical). Always shown with an icon and
 * a label, never as colour alone.
 */
export const SERIES = {
  blue: { mark: "#2a78d6", track: "#dbe9fb" },
  orange: { mark: "#eb6834", track: "#fbe2d6" },
  aqua: { mark: "#1baf7a", track: "#d3f1e5" },
} as const;
export type SeriesName = keyof typeof SERIES;

export const STATUS = {
  good: { mark: "#0ca30c", track: "#d5f0d5" },
  warning: { mark: "#fab219", track: "#fdeec9" },
  critical: { mark: "#d03b3b", track: "#f6d8d8" },
  none: { mark: "#bac2d1", track: "#eef1f6" },
} as const;

type Tint = { mark: string; track: string };

/** One ratio against its whole, as a ring with the figure printed inside. `share = null` means there is nothing to measure yet. */
export function Ring({ share, tint, label, size = 60 }: { share: number | null; tint: Tint; label: string; size?: number }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = share === null ? 0 : Math.max(0, Math.min(1, share));
  const text = share === null ? "–" : `${Math.round(clamped * 100)}%`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={share === null ? `${label}: no data yet` : `${label}: ${text}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={tint.track} strokeWidth={stroke} />
      {clamped > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tint.mark}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * clamped} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dasharray] duration-700"
        />
      )}
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-ink-900 text-[13px] font-semibold">
        {text}
      </text>
    </svg>
  );
}

/** A headline number with the ratio that puts it in context. */
export function StatTile({ label, value, total, note, ring, testId }: { label: string; value: ReactNode; total?: ReactNode; note?: ReactNode; ring?: ReactNode; testId?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white p-5" data-testid={testId} data-stat={label}>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
        <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-ink-900">
          {value}
          {total !== undefined && <span className="ml-1 text-sm font-medium text-ink-400">/ {total}</span>}
        </p>
        {note && <p className="mt-2 line-clamp-2 text-xs text-ink-500">{note}</p>}
      </div>
      {ring}
    </div>
  );
}

/**
 * Rows that compare one measure across named things: a name, a bar and a figure per
 * row, bars on a shared scale so lengths can be compared down the list.
 */
export function BarRow({ name, share, figure, detail, tint = SERIES.blue, muted = false }: { name: ReactNode; share: number; figure: ReactNode; detail?: ReactNode; tint?: Tint; muted?: boolean }) {
  const width = `${Math.max(0, Math.min(1, share)) * 100}%`;
  return (
    <div className="group">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium text-ink-800">{name}</span>
        <span className={cn("shrink-0 tabular-nums", muted ? "text-ink-400" : "font-semibold text-ink-900")}>{figure}</span>
      </div>
      <div className="mt-1.5 h-2 w-full rounded-full" style={{ background: muted ? STATUS.none.track : tint.track }}>
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width, background: muted ? STATUS.none.mark : tint.mark, minWidth: share > 0 ? 4 : 0 }} />
      </div>
      {detail && <p className="mt-1 text-xs text-ink-500">{detail}</p>}
    </div>
  );
}

export function Panel({ title, hint, action, children, className }: { title: string; hint?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-ink-100 bg-white p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
        </div>
        {action && <div className="shrink-0 whitespace-nowrap">{action}</div>}
      </div>
      {children}
    </section>
  );
}
