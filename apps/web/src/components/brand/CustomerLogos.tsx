import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Wordmarks for the sample customers used across the site. The companies are fictional
 * placeholders; swap in real customer logos (with permission) before launch.
 */
type LogoDef = { name: string; node: ReactNode };

const svg = (children: ReactNode, viewBox = "0 0 24 24") => (
  <svg viewBox={viewBox} className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden="true">
    {children}
  </svg>
);

export const customerLogoDefs: LogoDef[] = [
  {
    name: "Northwind",
    node: (
      <span className="flex items-center gap-2 text-[1.35rem] font-bold tracking-tight">
        {svg(<path d="M12 2 15 12 12 22 9 12Z M2 12l10-3 10 3-10 3Z" opacity=".9" />)}
        Northwind
      </span>
    ),
  },
  {
    name: "Brightlane",
    node: (
      <span className="flex items-center gap-1.5 text-[1.3rem] font-semibold lowercase tracking-tight">
        {svg(<><circle cx="12" cy="12" r="4.5" /><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4M4.6 4.6l2.8 2.8M16.6 16.6l2.8 2.8M4.6 19.4l2.8-2.8M16.6 7.4l2.8-2.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>)}
        brightlane
      </span>
    ),
  },
  {
    name: "Kettle & Co",
    node: <span className="font-serif text-[1.45rem] font-bold italic tracking-tight">Kettle&amp;Co.</span>,
  },
  {
    name: "Orbitly",
    node: (
      <span className="flex items-center gap-2 text-[1.3rem] font-extrabold tracking-tight">
        {svg(<><circle cx="12" cy="12" r="3.5" /><ellipse cx="12" cy="12" rx="10" ry="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" transform="rotate(-25 12 12)" /></>)}
        ORBITLY
      </span>
    ),
  },
  {
    name: "Paperhaus",
    node: (
      <span className="flex items-center gap-2 text-[1.25rem] font-medium tracking-[0.2em]">
        {svg(<path d="M5 2h10l4 4v16H5Z M15 2v4h4" />)}
        PAPERHAUS
      </span>
    ),
  },
  {
    name: "Lumen Health",
    node: (
      <span className="flex items-center gap-2 text-[1.25rem] font-semibold tracking-tight">
        {svg(<path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7Z" />)}
        lumen<span className="font-light">health</span>
      </span>
    ),
  },
  {
    name: "Vantage",
    node: (
      <span className="flex items-center gap-1 text-[1.4rem] font-black tracking-tighter">
        {svg(<path d="M2 4h5l5 11 5-11h5L12 22Z" />)}
        antage
      </span>
    ),
  },
  {
    name: "Quillstack",
    node: <span className="font-mono text-[1.2rem] font-bold tracking-tight">quill/stack</span>,
  },
  {
    name: "Fernway",
    node: (
      <span className="flex items-center gap-2 text-[1.3rem] font-semibold tracking-tight">
        {svg(<path d="M12 22V9M12 9c0-4 3-7 8-7 0 5-3 8-8 8Zm0 4c0-3-2.5-6-7-6 0 4 2.5 6.5 7 6.5Z" />)}
        Fernway
      </span>
    ),
  },
  {
    name: "Helio",
    node: (
      <span className="flex items-center gap-1.5 text-[1.45rem] font-bold tracking-tight">
        {svg(<path d="M12 2a10 10 0 1 0 0 20V2Z" />)}
        helio
      </span>
    ),
  },
];

export function CustomerLogo({ name, className }: { name: string; className?: string }) {
  const def = customerLogoDefs.find((l) => l.name === name);
  if (!def) return null;
  return (
    <span className={cn("inline-flex items-center text-ink-800", className)} role="img" aria-label={def.name}>
      {def.node}
    </span>
  );
}

export function LogoMarquee({ className }: { className?: string }) {
  const items = [...customerLogoDefs, ...customerLogoDefs];
  return (
    <div className={cn("mask-fade-x overflow-hidden", className)}>
      <ul className="flex w-max animate-marquee items-center gap-16 hover:[animation-play-state:paused]">
        {items.map((l, i) => (
          <li key={`${l.name}-${i}`} aria-hidden={i >= customerLogoDefs.length} className="text-ink-400 transition-colors hover:text-ink-900">
            <span role="img" aria-label={l.name}>{l.node}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
