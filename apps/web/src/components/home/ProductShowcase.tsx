"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CustomerLogo } from "@/components/brand/CustomerLogos";
import { cn } from "@/lib/cn";

export type ShowcaseTab = {
  title: string;
  body: string;
  stat: { value: string; label: string };
  logo: string;
  visual: ReactNode;
};

const DURATION = 7000;

/** Large product frame with three tabs underneath; tabs auto-advance with a progress bar and pause on hover. */
export function ProductShowcase({ tabs }: { tabs: ShowcaseTab[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !inView) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % tabs.length), DURATION);
    return () => clearTimeout(t);
  }, [active, paused, inView, tabs.length]);

  const running = !paused && inView;

  return (
    <div ref={ref} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="bg-mesh-light relative overflow-hidden rounded-[1.75rem] border border-ink-100 px-3 pt-6 sm:px-10 sm:pt-12 lg:px-20">
        <div className="relative mx-auto h-[25rem] max-w-4xl sm:h-[27rem]">
          {tabs.map((t, i) => (
            <div
              key={t.title}
              aria-hidden={i !== active}
              className={cn(
                "absolute inset-0 transition-all duration-700 ease-out",
                i === active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
              )}
            >
              {t.visual}
            </div>
          ))}
        </div>
      </div>

      <div role="tablist" className="mt-2 grid grid-cols-1 [&>*]:min-w-0 gap-2 md:grid-cols-3 md:gap-6">
        {tabs.map((t, i) => (
          <button
            key={t.title}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={cn("group rounded-2xl p-4 text-left transition-colors md:p-5", i === active ? "bg-white" : "hover:bg-ink-50/60")}
          >
            <span className="relative block h-0.5 overflow-hidden rounded-full bg-ink-100">
              {i === active && (
                <span
                  key={`${active}-${running}`}
                  className={cn("absolute inset-0 origin-left bg-brand-600", running ? "animate-progress" : "")}
                  style={{ ["--progress-duration" as string]: `${DURATION}ms` }}
                />
              )}
            </span>
            <span className={cn("mt-5 block font-semibold transition-colors", i === active ? "text-ink-900" : "text-ink-500 group-hover:text-ink-800")}>{t.title}</span>
            <span className={cn("mt-2 block text-sm leading-relaxed transition-colors", i === active ? "text-ink-500" : "text-ink-400")}>{t.body}</span>
            <span className="mt-5 flex items-stretch gap-2">
              <span className="flex-1 rounded-xl border border-ink-100 bg-white px-4 py-3">
                <span className="block text-xl font-semibold tracking-tight text-ink-900">{t.stat.value}</span>
                <span className="block text-xs text-ink-500">{t.stat.label}</span>
              </span>
              <span className="grid w-28 place-items-center rounded-xl border border-ink-100 bg-white px-2 text-ink-500 [&_span]:!text-[0.8rem] [&_svg]:!size-4">
                <CustomerLogo name={t.logo} />
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
