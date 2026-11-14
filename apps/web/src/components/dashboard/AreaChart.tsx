"use client";

import { useMemo, useRef, useState, useLayoutEffect } from "react";
import { count } from "@/lib/api/format";

export type Point = { date: string; value: number };

const HEIGHT = 250;
const MARGIN = { top: 18, right: 14, bottom: 30, left: 38 };

function parseDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d); // a calendar day, not an instant: no time zone shift
}

/** The top of the axis: the smallest round number at or above the data's maximum. */
export function niceMax(max: number): number {
  if (max <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  for (const factor of [1, 2, 4, 5, 8, 10]) if (factor * magnitude >= max) return factor * magnitude;
  return 10 * magnitude;
}

/** A smooth line through the points that never dips below or rises above them (monotone cubic). */
export function smoothPath(points: [number, number][]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;
  const n = points.length;
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) slopes.push((points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]));
  const tangents = [slopes[0]];
  for (let i = 1; i < n - 1; i++) tangents.push(slopes[i - 1] * slopes[i] <= 0 ? 0 : (2 * slopes[i - 1] * slopes[i]) / (slopes[i - 1] + slopes[i]));
  tangents.push(slopes[n - 2]);
  let path = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = (points[i + 1][0] - points[i][0]) / 3;
    path += `C${points[i][0] + dx},${points[i][1] + tangents[i] * dx} ${points[i + 1][0] - dx},${points[i + 1][1] - tangents[i + 1] * dx} ${points[i + 1][0]},${points[i + 1][1]}`;
  }
  return path;
}

/**
 * One measure over time as a line with a soft fill. Hovering or touching shows the day
 * and its value; the same numbers are in a table for screen readers.
 */
export function AreaChart({ points, measure, color, line = "#0a1c40" }: { points: Point[]; measure: string; /** the fill under the line */ color: string; line?: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);

  // Measured before the first paint, so the chart is never drawn wider than its container.
  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    setWidth(Math.max(280, Math.round(element.clientWidth)));
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const geometry = useMemo(() => {
    const top = niceMax(Math.max(0, ...points.map((p) => p.value)));
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const x = (i: number) => MARGIN.left + (points.length <= 1 ? innerWidth / 2 : (i / (points.length - 1)) * innerWidth);
    const y = (value: number) => MARGIN.top + innerHeight - (value / top) * innerHeight;
    const xy = points.map((p, i) => [x(i), y(p.value)] as [number, number]);
    const line = smoothPath(xy);
    const baseline = MARGIN.top + innerHeight;
    const area = xy.length > 1 ? `${line}L${xy[xy.length - 1][0]},${baseline}L${xy[0][0]},${baseline}Z` : "";
    return { top, x, y, xy, line, area, baseline, ticks: [0, top / 2, top] };
  }, [points, width]);

  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(width / 90))));
  const gradient = `area-${color.replace("#", "")}`;
  const hovered = active !== null ? points[active] : null;

  function locate(clientX: number) {
    const box = frame.current?.getBoundingClientRect();
    if (!box || points.length === 0) return;
    const inner = width - MARGIN.left - MARGIN.right;
    const ratio = (clientX - box.left - MARGIN.left) / inner;
    setActive(Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1)))));
  }

  return (
    <div ref={frame} className="relative overflow-x-clip" data-testid="timeline">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`${measure} per day`}
        onPointerMove={(e) => locate(e.clientX)}
        onPointerDown={(e) => locate(e.clientX)}
        onPointerLeave={() => setActive(null)}
        className="block touch-pan-y select-none"
      >
        <defs>
          <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {geometry.ticks.map((tick) => (
          <g key={tick}>
            <line x1={MARGIN.left} x2={width - MARGIN.right} y1={geometry.y(tick)} y2={geometry.y(tick)} stroke={tick === 0 ? "#c4c4c4" : "#eeeeee"} strokeWidth="1" />
            <text x={MARGIN.left - 8} y={geometry.y(tick)} textAnchor="end" dominantBaseline="central" className="t-figure fill-fg-3 text-[10.5px]">
              {count(tick)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          (i % labelEvery === 0 && points.length - 1 - i >= labelEvery) || i === points.length - 1 ? (
            <text key={p.date} x={geometry.x(i)} y={HEIGHT - 8} textAnchor={i === points.length - 1 ? "end" : i === 0 ? "start" : "middle"} className="fill-fg-3 text-[11px]">
              {parseDay(p.date).toLocaleDateString("en-US", { weekday: "short" })} {parseDay(p.date).getDate()}
            </text>
          ) : null,
        )}
        {geometry.area && <path d={geometry.area} fill={`url(#${gradient})`} className="animate-fade" />}
        <path key={measure} d={geometry.line} fill="none" stroke={line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" className="animate-draw" style={{ ["--draw-length" as string]: 1 }} />
        {active !== null && (
          <g pointerEvents="none">
            <line x1={geometry.xy[active][0]} x2={geometry.xy[active][0]} y1={MARGIN.top} y2={geometry.baseline} stroke="#6a6a6a" strokeWidth="1" strokeDasharray="2 3" />
            <circle cx={geometry.xy[active][0]} cy={geometry.xy[active][1]} r="5" fill={color} stroke={line} strokeWidth="2" />
          </g>
        )}
      </svg>
      {hovered && active !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-control border border-line-strong bg-surface px-2.5 py-1.5 text-center shadow-overlay"
          style={{ left: Math.max(60, Math.min(width - 60, geometry.xy[active][0])), top: Math.max(44, geometry.xy[active][1] - 10) }}
        >
          <p className="whitespace-nowrap text-[11px] text-fg-3">{parseDay(hovered.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
          <p className="whitespace-nowrap text-[13px] font-medium text-fg">
            <span className="t-figure">{count(hovered.value)}</span> <span className="font-normal text-fg-3">{measure.toLowerCase()}</span>
          </p>
        </div>
      )}
      <table className="sr-only">
        <caption>{measure} per day</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">{measure}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
