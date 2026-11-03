import { ArrowRight, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LogoStrip } from "@/components/sections/LogoStrip";
import { HeroCallForm } from "./HeroCallForm";

/** White "inverted corner" so the CTA tab looks cut out of the hero card. */
function Corner({ className }: { className: string }) {
  return (
    <span
      className={`absolute size-6 ${className}`}
      style={{ background: "radial-gradient(circle at 0 0, transparent 1.5rem, #fff calc(1.5rem + 0.5px))" }}
      aria-hidden="true"
    />
  );
}

export function Hero() {
  return (
    <section className="pt-[7.5rem] sm:pt-32">
      <div className="container-page">
        <div className="relative">
          <div className="bg-mesh-dark relative overflow-hidden rounded-[2rem] px-6 pb-10 pt-12 text-white sm:px-12 lg:min-h-[35rem] lg:pb-28 lg:pt-16">
            <div className="bg-dots absolute inset-0 opacity-25 invert" aria-hidden="true" />
            <svg className="absolute -right-24 -top-24 size-[30rem] text-white/10" viewBox="0 0 200 200" fill="none" aria-hidden="true">
              {[30, 50, 70, 90].map((r) => (
                <circle key={r} cx="100" cy="100" r={r} stroke="currentColor" strokeWidth="0.6" />
              ))}
            </svg>
            <div className="relative grid grid-cols-1 [&>*]:min-w-0 gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
              <div className="max-w-xl">
                <Eyebrow tone="dark">The AI phone system for sales & support</Eyebrow>
                <h1 className="mt-6 text-[2.5rem] font-semibold leading-[1.04] tracking-tight text-balance sm:text-[3.4rem] lg:text-[3.7rem]">
                  Every call answered, 24/7. <span className="text-lime-300">By your team, or by AI.</span>
                </h1>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75 text-pretty">
                  Route, dial, record and analyse every conversation in one cloud phone system, with AI agents that pick up when your team can&apos;t.
                </p>
                <div className="mt-10 flex items-center gap-4 lg:mt-16">
                  <div className="flex -space-x-2" aria-hidden="true">
                    {["from-lime-300 to-brand-500", "from-sky-300 to-brand-600", "from-brand-200 to-sky-500", "from-lime-200 to-sky-400"].map((g, i) => (
                      <span key={i} className={`size-9 rounded-full border-2 border-brand-900 bg-gradient-to-br ${g}`} />
                    ))}
                  </div>
                  <div className="text-sm">
                    <p className="flex items-center gap-1 font-semibold">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className="size-3.5 fill-lime-300 text-lime-300" aria-hidden="true" />
                      ))}
                      <span className="ml-1">4.8/5</span>
                    </p>
                    <p className="text-white/65">from 2,300+ reviews by sales & support teams</p>
                  </div>
                </div>
              </div>
              <div className="lg:pt-2">
                <HeroCallForm />
              </div>
            </div>
          </div>

          {/* CTA tab "cut out" of the card's bottom-right corner (desktop) */}
          <div className="absolute bottom-0 right-0 hidden rounded-tl-[1.75rem] bg-white pl-5 pt-5 lg:block">
            <Corner className="-top-6 right-0" />
            <Corner className="-left-6 bottom-0" />
            <div className="flex gap-3">
              <ButtonLink href="/demo" size="lg">
                Book a demo
              </ButtonLink>
              <ButtonLink href="/signup" variant="outline" size="lg">
                Start free trial <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:hidden">
          <ButtonLink href="/demo" size="lg">Book a demo</ButtonLink>
          <ButtonLink href="/signup" variant="outline" size="lg">Start free trial</ButtonLink>
        </div>

        <div className="mt-14 sm:mt-16">
          <LogoStrip />
        </div>
      </div>
    </section>
  );
}
