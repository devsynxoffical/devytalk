"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bot, Headphones, MapPin } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const COUNTRIES = [
  { flag: "🇺🇸", name: "United States", number: "+1 (415) 555 0134", city: "San Francisco", lang: "English", agent: "Olivia", team: "Sales US" },
  { flag: "🇬🇧", name: "United Kingdom", number: "+44 20 7946 0321", city: "London", lang: "English", agent: "James", team: "Support UK" },
  { flag: "🇩🇪", name: "Germany", number: "+49 30 1234 5678", city: "Berlin", lang: "German", agent: "Lena", team: "Sales DACH" },
  { flag: "🇪🇸", name: "Spain", number: "+34 91 123 4567", city: "Madrid", lang: "Spanish", agent: "Lucía", team: "Support ES" },
  { flag: "🇦🇪", name: "UAE", number: "+971 4 123 4567", city: "Dubai", lang: "Arabic", agent: "Omar", team: "Sales MENA" },
  { flag: "🇵🇰", name: "Pakistan", number: "+92 42 3512 3456", city: "Lahore", lang: "Urdu", agent: "Ayesha", team: "Support PK" },
];

const stats = [
  { value: "140+", label: "Countries with local numbers" },
  { value: "30+", label: "Languages your AI agent speaks" },
  { value: "Port in", label: "Keep your numbers, free" },
  { value: "99.99%", label: "Uptime, backed by SLA" },
];

export function AgentsPanel() {
  const [i, setI] = useState(2);
  const c = COUNTRIES[i];

  return (
    <div>
      <div className="shadow-card overflow-hidden rounded-[1.75rem] border border-ink-100 bg-white">
        <div className="grid grid-cols-1 [&>*]:min-w-0 lg:grid-cols-[15rem_1fr]">
          <div className="border-b border-ink-100 p-4 lg:border-b-0 lg:border-r">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Choose a country</p>
            <ul role="listbox" aria-label="Country" className="flex gap-1 overflow-x-auto lg:flex-col">
              {COUNTRIES.map((x, idx) => (
                <li key={x.name} className="shrink-0">
                  <button
                    type="button"
                    role="option"
                    aria-selected={idx === i}
                    onClick={() => setI(idx)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      idx === i ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200" : "text-ink-600 hover:bg-ink-50",
                    )}
                  >
                    <span className="text-lg leading-none" aria-hidden="true">{x.flag}</span>
                    {x.name}
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden px-2 pt-6 lg:block">
              <Link href="/demo" className={buttonClass("primary", "sm", "w-full")}>
                Book a demo <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/numbers" className="mt-3 block text-center text-xs font-semibold text-brand-700 hover:underline">
                See all 140+ countries
              </Link>
            </div>
          </div>

          <div className="p-5 sm:p-8" aria-live="polite">
            <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-50 via-white to-sky-300/20 p-5">
              <div>
                <p className="text-xs font-medium text-ink-500">Your local number · {c.name}</p>
                <p key={c.number} className="mt-1 animate-[fadeIn_.35s_ease] text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{c.number}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-ink-600 shadow-sm">
                <MapPin className="size-3.5 text-brand-600" aria-hidden="true" /> {c.city}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 [&>*]:min-w-0 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-ink-100 p-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
                  <Headphones className="size-3.5" aria-hidden="true" /> Your team
                </span>
                <div className="mt-4 flex items-center gap-3">
                  <span className="relative grid size-11 place-items-center rounded-full bg-gradient-to-br from-sky-300 to-brand-600 font-semibold text-white">
                    {c.agent[0]}
                    <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-brand-500" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900">{c.agent}</p>
                    <p className="text-xs text-ink-500">{c.team} · on a call</p>
                  </div>
                </div>
                <div className="mt-5 flex h-10 items-center gap-[3px]" aria-hidden="true">
                  {Array.from({ length: 36 }, (_, k) => (
                    <span key={k} className="w-1 rounded-full bg-brand-300" style={{ height: `${20 + Math.abs(Math.sin(k * 1.7 + i)) * 80}%` }} />
                  ))}
                </div>
                <div className="mt-4 flex gap-2 font-mono text-xs">
                  {["02", "14", "37"].map((t, k) => (
                    <span key={k} className="rounded-lg bg-ink-50 px-2.5 py-1.5 font-semibold text-ink-700">{t}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-ink-100 p-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-300/50 px-2.5 py-1 text-xs font-semibold text-ink-800">
                  <Bot className="size-3.5" aria-hidden="true" /> AI agent
                </span>
                <div className="mt-4 flex items-center gap-3">
                  <span className="relative grid size-11 place-items-center rounded-full bg-gradient-to-br from-lime-300 via-brand-400 to-sky-400">
                    <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-300/50" aria-hidden="true" />
                    <span className="relative size-4 rounded-full bg-white/90" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900">Devy · After hours</p>
                    <p className="text-xs text-ink-500">Answering in {c.lang}</p>
                  </div>
                </div>
                <div className="mt-5 space-y-2 text-sm">
                  <p className="rounded-xl rounded-tl-sm bg-ink-50 px-3 py-2 text-ink-700">I&apos;d like to change my delivery address.</p>
                  <p className="ml-6 rounded-xl rounded-tr-sm bg-brand-600 px-3 py-2 text-white">Done. I&apos;ve updated it and texted you a confirmation.</p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm text-ink-500">
              Calls reach {c.agent} first. If nobody picks up within 20 seconds, Devy answers, resolves what it can and books a callback for the rest.
            </p>
          </div>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 [&>*]:min-w-0 grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="shadow-card rounded-2xl border border-ink-100 bg-white p-5">
            <dd className="text-3xl font-semibold tracking-tight text-ink-900">{s.value}</dd>
            <dt className="mt-1 text-sm text-ink-500">{s.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
