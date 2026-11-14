"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Colours for data marks. Text never wears these: figures and labels stay in ink, and a
 * coloured mark beside them carries identity.
 *
 * SERIES: bright blue for a measure, deep navy for the one being emphasised (conversions,
 * hot leads). Told apart by lightness, on a light track.
 * STATUS: reserved for state. Always shown with a word, never as colour alone.
 */
export const SERIES = {
  blue: { mark: "#2471e7", track: "#e3ecfb" },
  navy: { mark: "#0a1c40", track: "#e4e7ee" },
} as const;

export const STATUS = {
  good: { mark: "#2471e7", track: "#e3ecfb" },
  warning: { mark: "#e6701e", track: "#eeeeee" },
  critical: { mark: "#e5281c", track: "#eeeeee" },
  none: { mark: "#bdbdbd", track: "#efefef" },
} as const;

type Tint = { mark: string; track: string };

/** One ratio against its whole, as a ring with the figure printed inside. `share = null` means there is nothing to measure yet. */
export function Ring({ share, tint, label, size = 52 }: { share: number | null; tint: Tint; label: string; size?: number }) {
  const stroke = size < 48 ? 4 : 5;
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
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className={cn("t-figure fill-fg font-medium", size < 48 ? "text-[10.5px]" : "text-[12px]")}>
        {text}
      </text>
    </svg>
  );
}

/**
 * Rows that compare one measure across named things: a name, a bar and a figure per
 * row, bars on a shared scale so lengths can be compared down the list.
 */
export function BarRow({ name, share, figure, detail, tint = SERIES.blue, muted = false }: { name: ReactNode; share: number; figure: ReactNode; detail?: ReactNode; tint?: Tint; muted?: boolean }) {
  const width = `${Math.max(0, Math.min(1, share)) * 100}%`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="min-w-0 truncate text-fg">{name}</span>
        <span className={cn("t-figure shrink-0", muted ? "text-fg-3" : "font-medium text-fg")}>{figure}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full" style={{ background: muted ? STATUS.none.track : tint.track }}>
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width, background: muted ? STATUS.none.mark : tint.mark, minWidth: share > 0 ? 3 : 0 }} />
      </div>
      {detail && <p className="t-meta mt-1">{detail}</p>}
    </div>
  );
}
