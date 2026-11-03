"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  BarChart3,
  Bot,
  CalendarCheck,
  Check,
  Circle,
  Mic,
  Pause,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOff,
  PhoneCall,
  Settings,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { AppIcon } from "@/components/brand/AppIcon";
import { cn } from "@/lib/cn";

const TRANSCRIPT = [
  { who: "Emma", text: "We're growing to 30 agents next quarter.", tone: "them" },
  { who: "You", text: "Great. Do you need numbers outside Germany?", tone: "you" },
  { who: "Emma", text: "Yes, UK and Spain, and it has to sync with HubSpot.", tone: "them" },
  { who: "AI", text: "Buying signal · Suggest Growth plan · 3 numbers", tone: "ai" },
] as const;

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** A floating card that drifts with the mouse (depth) and bobs gently (delay). */
function Floating({ depth, delay, className, children }: { depth: number; delay: number; className: string; children: ReactNode }) {
  return (
    <div
      className={cn("absolute z-20 hidden xl:block", className)}
      style={{ transform: `translate3d(calc(var(--mx, 0) * ${depth}px), calc(var(--my, 0) * ${depth}px), 0)`, transition: "transform .25s ease-out" }}
      aria-hidden="true"
    >
      <div className="animate-[floaty_6s_ease-in-out_infinite]" style={{ animationDelay: `${delay}ms` }}>
        <div className="animate-[menuPanel_.7s_cubic-bezier(.2,.8,.2,1)_both]" style={{ animationDelay: `${600 + delay / 4}ms` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function HeroScene() {
  const ref = useRef<HTMLDivElement>(null);
  const [seconds, setSeconds] = useState(134);
  const [lines, setLines] = useState(1);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    const u = setInterval(() => setLines((n) => (n >= TRANSCRIPT.length ? 1 : n + 1)), 2400);
    return () => {
      clearInterval(t);
      clearInterval(u);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        el.style.setProperty("--mx", x.toFixed(3));
        el.style.setProperty("--my", y.toFixed(3));
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div ref={ref} className="relative mx-auto max-w-5xl" style={{ "--mx": 0, "--my": 0 } as CSSProperties}>
      {/* Ripples behind the window */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-0 -translate-x-1/2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 animate-[ripple_6s_ease-out_infinite] rounded-full border border-brand-300/30"
            style={{ animationDelay: `${i * 2}s` }}
          />
        ))}
      </div>

      <Floating depth={-14} delay={0} className="-left-36 bottom-6">
        <div className="shadow-float w-56 rounded-2xl border border-ink-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="relative grid size-10 place-items-center rounded-full bg-brand-600 text-white">
              <span className="absolute inset-0 animate-ping rounded-full bg-brand-400 opacity-40" />
              <PhoneIncoming className="relative size-4" />
            </span>
            <div>
              <p className="text-[11px] font-medium text-ink-500">Incoming · Sales DE</p>
              <p className="text-sm font-semibold text-ink-900">+49 30 1234 5678</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold">
            <span className="rounded-lg bg-ink-50 py-1.5 text-center text-ink-600">Decline</span>
            <span className="rounded-lg bg-brand-600 py-1.5 text-center text-white">Accept</span>
          </div>
        </div>
      </Floating>

      <Floating depth={18} delay={1200} className="-right-20 -top-12">
        <div className="shadow-float w-60 rounded-2xl border border-lime-400/60 bg-white p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-700">
            <span className="grid size-5 place-items-center rounded-md bg-lime-300 text-ink-900">
              <Bot className="size-3" />
            </span>
            Devy · AI agent
          </p>
          <p className="mt-2 text-sm font-semibold text-ink-900">Demo booked for Thu, 11:00</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-brand-700">
            <CalendarCheck className="size-3.5" /> Added to Google Calendar
          </p>
        </div>
      </Floating>

      <Floating depth={-22} delay={2400} className="-left-24 top-40">
        <div className="shadow-float rounded-2xl border border-ink-100 bg-white p-4">
          <p className="text-[11px] font-medium text-ink-500">Customer satisfaction</p>
          <div className="mt-1 flex items-end gap-3">
            <p className="flex items-center gap-1 text-2xl font-semibold text-ink-900">
              4.9 <Star className="size-4 fill-lime-400 text-lime-500" />
            </p>
            <svg viewBox="0 0 80 28" className="h-7 w-20" fill="none">
              <path d="M0 22 L12 18 L24 20 L36 12 L48 14 L60 6 L80 3" stroke="#0fa884" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </Floating>

      <Floating depth={12} delay={3200} className="-right-28 -bottom-8">
        <div className="shadow-float flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 pr-4">
          <AppIcon icon="hubspot" name="HubSpot" color="#ff7a59" size="sm" />
          <div>
            <p className="text-sm font-semibold text-ink-900">Logged to HubSpot</p>
            <p className="flex items-center gap-1 text-xs text-brand-700">
              <Check className="size-3.5" /> Notes, recording, summary
            </p>
          </div>
        </div>
      </Floating>

      {/* Main app window */}
      <div
        className="relative z-10 overflow-hidden rounded-[1.25rem] border border-ink-100 bg-white shadow-[0_40px_100px_-30px_rgb(10_22_40/0.35),0_2px_8px_rgb(10_22_40/0.04)]"
        style={{ transform: "translate3d(calc(var(--mx, 0) * 4px), calc(var(--my, 0) * 4px), 0)", transition: "transform .3s ease-out" }}
      >
        <div className="flex h-10 items-center gap-2 border-b border-ink-100 bg-ink-50/50 px-4">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="mx-auto rounded-md bg-white px-10 py-0.5 text-[11px] text-ink-400 ring-1 ring-ink-100">app.devytalk.com</span>
        </div>

        <div className="flex h-[25rem] text-left">
          <div className="hidden w-14 flex-col items-center gap-2 border-r border-ink-100 py-4 sm:flex" aria-hidden="true">
            {[PhoneCall, Users, BarChart3, Bot, Settings].map((I, k) => (
              <span key={k} className={cn("grid size-9 place-items-center rounded-lg", k === 0 ? "bg-brand-600 text-white" : "text-ink-400")}>
                <I className="size-4" />
              </span>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-sky-300 to-brand-600 font-semibold text-white">E</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900">Emma Fischer</p>
                <p className="truncate text-xs text-ink-500">Northwind · Head of Operations</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                <span className="size-1.5 animate-pulse rounded-full bg-brand-500" />
                <span className="font-mono tabular-nums">{fmt(seconds)}</span>
              </span>
            </div>

            <div className="mt-4 flex h-12 items-center gap-[3px] rounded-xl bg-ink-50/70 px-3" aria-hidden="true">
              {Array.from({ length: 56 }, (_, k) => (
                <span
                  key={k}
                  className="w-[3px] flex-1 origin-center animate-[eq_1.1s_ease-in-out_infinite] rounded-full bg-brand-400"
                  style={{ height: `${25 + Math.abs(Math.sin(k * 0.55)) * 70}%`, animationDelay: `${(k % 9) * 110}ms` }}
                />
              ))}
            </div>

            <div className="mt-4 flex-1 space-y-2 overflow-hidden" aria-live="off">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                <Sparkles className="size-3 text-brand-500" aria-hidden="true" /> Live transcript
              </p>
              {TRANSCRIPT.slice(0, lines).map((l) => (
                <p
                  key={l.text}
                  className={cn(
                    "w-fit max-w-[90%] animate-[menuPanel_.4s_cubic-bezier(.2,.8,.2,1)] rounded-xl px-3 py-1.5 text-[13px]",
                    l.tone === "them" && "bg-ink-50 text-ink-700",
                    l.tone === "you" && "ml-auto bg-brand-600 text-white",
                    l.tone === "ai" && "border border-lime-400 bg-lime-300/30 font-medium text-ink-800",
                  )}
                >
                  {l.tone === "ai" && <Sparkles className="mr-1 inline size-3" aria-hidden="true" />}
                  {l.text}
                </p>
              ))}
              {lines < TRANSCRIPT.length && (
                <span className="flex w-fit gap-1 rounded-xl bg-ink-50 px-3 py-2.5" aria-hidden="true">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="size-1.5 animate-[typing_1.2s_ease-in-out_infinite] rounded-full bg-ink-400" style={{ animationDelay: `${d * 150}ms` }} />
                  ))}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2.5" aria-hidden="true">
              {[Mic, Pause, PhoneForwarded, Circle].map((I, k) => (
                <span key={k} className="grid size-10 place-items-center rounded-full border border-ink-100 text-ink-600">
                  <I className={cn("size-4", k === 3 && "fill-red-500 text-red-500")} />
                </span>
              ))}
              <span className="grid size-10 place-items-center rounded-full bg-red-500 text-white">
                <PhoneOff className="size-4" />
              </span>
            </div>
          </div>

          <div className="hidden w-60 shrink-0 border-l border-ink-100 p-4 md:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Queues</p>
            <ul className="mt-2 space-y-2.5">
              {[
                ["Sales", 2, 70],
                ["Support", 0, 25],
                ["Billing", 1, 45],
              ].map(([q, w, pct]) => (
                <li key={q as string}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-ink-700">{q}</span>
                    <span className="text-ink-500">{w} waiting</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Team</p>
            <ul className="mt-2 space-y-2">
              {[
                ["Lena", "On a call", "bg-red-400"],
                ["James", "Available", "bg-brand-500"],
                ["Ayesha", "Wrap-up", "bg-amber-400"],
                ["Devy (AI)", "Covering overflow", "bg-lime-400"],
              ].map(([n, s, c]) => (
                <li key={n} className="flex items-center gap-2 text-xs">
                  <span className="relative grid size-7 place-items-center rounded-full bg-ink-100 font-semibold text-ink-600">
                    {n[0]}
                    <span className={cn("absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white", c)} />
                  </span>
                  <span>
                    <span className="block font-medium text-ink-800">{n}</span>
                    <span className="block text-ink-500">{s}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
