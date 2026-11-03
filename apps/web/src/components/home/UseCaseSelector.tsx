"use client";

import { useState } from "react";
import { CalendarClock, Check, Clock4, MoonStar, PhoneMissed, RefreshCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

const CASES = [
  {
    id: "after-hours",
    icon: MoonStar,
    title: "After-hours & weekend calls",
    sub: "Answer when the office is closed",
    feed: { who: "Caller from Berlin", status: "Resolved", tone: "green", time: "23:41", text: "Explained return policy, created a return label and emailed it." },
  },
  {
    id: "overflow",
    icon: PhoneMissed,
    title: "Overflow when the queue spikes",
    sub: "No caller waits more than 30 seconds",
    feed: { who: "Inbound · Support queue", status: "Handed off", tone: "amber", time: "10:02", text: "Collected order number and issue, transferred to Lena with a summary." },
  },
  {
    id: "lead-follow-up",
    icon: Clock4,
    title: "Instant lead follow-up",
    sub: "Call web leads within 60 seconds",
    feed: { who: "Outbound · Demo request", status: "Booked", tone: "green", time: "14:16", text: "Qualified a 25-seat team and booked a demo for Thursday 11:00." },
  },
  {
    id: "reminders",
    icon: CalendarClock,
    title: "Reminders, renewals & follow-ups",
    sub: "Proactive calls that run themselves",
    feed: { who: "Outbound · Renewal", status: "Confirmed", tone: "green", time: "09:30", text: "Confirmed renewal, updated billing email and logged it to HubSpot." },
  },
  {
    id: "faq",
    icon: RefreshCcw,
    title: "Calls that repeat every day",
    sub: "Order status, opening hours, resets",
    feed: { who: "Inbound · Order status", status: "Resolved", tone: "green", time: "12:48", text: "Looked up order #48213 in Shopify and gave the delivery window." },
  },
] as const;

export function UseCaseSelector() {
  const [selected, setSelected] = useState<string[]>(["overflow", "lead-follow-up", "faq"]);
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const feed = CASES.filter((c) => selected.includes(c.id));

  return (
    <div className="relative">
      <div className="absolute inset-x-10 -inset-y-10 rounded-full bg-gradient-to-r from-brand-100 via-sky-300/30 to-lime-300/40 blur-3xl" aria-hidden="true" />
      <div className="shadow-float relative grid grid-cols-1 [&>*]:min-w-0 gap-4 rounded-[1.75rem] border border-ink-100 bg-white p-4 sm:p-6 lg:grid-cols-2">
        <fieldset>
          <legend className="px-1 pb-3 text-sm font-semibold text-ink-900">Which calls should AI cover?</legend>
          <div className="space-y-2">
            {CASES.map((c) => {
              const on = selected.includes(c.id);
              const Icon = c.icon;
              return (
                <label
                  key={c.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
                    on ? "border-brand-400 bg-brand-50/60 ring-2 ring-brand-100" : "border-ink-100 hover:border-ink-200",
                  )}
                >
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(c.id)} />
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", on ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-500")}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink-900">{c.title}</span>
                    <span className="block truncate text-xs text-ink-500">{c.sub}</span>
                  </span>
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-md border", on ? "border-brand-600 bg-brand-600 text-white" : "border-ink-300")}>
                    {on && <Check className="size-3.5" aria-hidden="true" />}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="rounded-2xl bg-ink-50/70 p-4">
          <div className="flex items-center justify-between px-1 pb-3">
            <p className="text-sm font-semibold text-ink-900">AI agent activity · today</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700">
              <span className="size-1.5 animate-pulse rounded-full bg-brand-500" /> Live
            </span>
          </div>
          <ul className="space-y-2" aria-live="polite">
            {feed.length === 0 && (
              <li className="rounded-xl border border-dashed border-ink-200 bg-white p-6 text-center text-sm text-ink-500">
                Pick at least one use case to see what your AI agent would handle.
              </li>
            )}
            {feed.map((c) => (
              <li key={c.id} className="animate-[fadeIn_.35s_ease] rounded-xl border border-ink-100 bg-white p-3.5">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                  <span className="inline-flex items-center gap-1 rounded-md bg-lime-300/50 px-1.5 py-0.5 text-ink-800">
                    <Sparkles className="size-3" aria-hidden="true" /> AI agent
                  </span>
                  <span className={cn("rounded-md px-1.5 py-0.5", c.feed.tone === "green" ? "bg-brand-100 text-brand-800" : "bg-amber-100 text-amber-800")}>{c.feed.status}</span>
                  <span className="text-ink-400">{c.feed.who}</span>
                  <span className="ml-auto font-mono text-ink-400">{c.feed.time}</span>
                </div>
                <p className="mt-2 text-sm text-ink-700">{c.feed.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
