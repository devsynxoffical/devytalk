"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Quote } from "lucide-react";
import { testimonials } from "@/content/social";
import { CustomerLogo } from "@/components/brand/CustomerLogos";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

export function Testimonials() {
  const [active, setActive] = useState(0);
  const t = testimonials[active];

  return (
    <section className="container-page py-16 sm:py-24">
      <SectionHeading title="What real teams are saying." />
      <div role="tablist" aria-label="Customer stories" className="mt-12 grid grid-cols-2 border-b border-ink-100 sm:grid-cols-5">
        {testimonials.map((x, i) => (
          <button
            key={x.company}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls="testimonial-panel"
            onClick={() => setActive(i)}
            className={cn(
              "relative flex h-20 items-center justify-center transition-colors",
              i === active ? "bg-brand-50/60 text-ink-900" : "text-ink-300 hover:text-ink-600",
              i === testimonials.length - 1 && "col-span-2 sm:col-span-1",
            )}
          >
            <CustomerLogo name={x.company} className="text-current [&_*]:!text-current" />
            <span className={cn("absolute inset-x-0 -bottom-px h-0.5 transition-colors", i === active ? "bg-brand-600" : "bg-transparent")} aria-hidden="true" />
          </button>
        ))}
      </div>

      <div id="testimonial-panel" role="tabpanel" className="mt-12 grid grid-cols-1 [&>*]:min-w-0 items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16" key={t.company}>
        <figure className="animate-[fadeIn_.5s_ease]">
          <Quote className="size-9 text-brand-500" aria-hidden="true" />
          <blockquote className="mt-5 text-2xl font-medium leading-snug tracking-tight text-ink-900 text-pretty sm:text-[1.75rem]">“{t.quote}”</blockquote>
          <figcaption className="mt-8 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-brand-300 to-brand-700 text-lg font-semibold text-white" aria-hidden="true">
              {t.name[0]}
            </span>
            <span>
              <span className="block font-semibold text-ink-900">{t.name}</span>
              <span className="block text-sm text-ink-500">
                {t.role}, {t.company}
              </span>
            </span>
          </figcaption>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/demo" className="inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">
              Book a demo
            </Link>
            <Link href="/customers" className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-ink-200 px-5 text-sm font-semibold text-ink-900 hover:bg-ink-50">
              Read the story <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </figure>

        <div className="bg-mesh-dark relative overflow-hidden rounded-[1.75rem] p-6 sm:p-8">
          <div className="bg-dots absolute inset-0 opacity-25 invert" aria-hidden="true" />
          <div className="relative flex min-h-56 items-start justify-between">
            <CustomerLogo name={t.company} className="!text-white [&_*]:!text-white" />
            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">Customer story</span>
          </div>
          <dl className="relative grid grid-cols-2 gap-3">
            {t.metrics.map((m) => (
              <div key={m.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <dd className="text-3xl font-semibold tracking-tight text-white">{m.value}</dd>
                <dt className="mt-1 text-sm text-white/70">{m.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
