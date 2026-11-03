import { ArrowRight, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { LogoStrip } from "@/components/sections/LogoStrip";
import { WordRotator } from "./WordRotator";
import { CallMeBar } from "./CallMeBar";
import { HeroScene } from "./HeroScene";

const enter = (delay: number) => ({ animation: `menuItem .8s cubic-bezier(.2,.8,.2,1) ${delay}ms both` });

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 sm:pt-40">
      {/* Animated aurora + dotted grid backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-0" aria-hidden="true">
        <div className="absolute -left-[10%] -top-40 size-[42rem] animate-[aurora_18s_ease-in-out_infinite] rounded-full bg-brand-200/60 blur-[110px]" />
        <div className="absolute -right-[8%] top-0 size-[36rem] animate-[aurora_22s_ease-in-out_infinite_reverse] rounded-full bg-sky-300/40 blur-[110px]" />
        <div className="absolute left-1/3 top-[28rem] size-[30rem] animate-[aurora_26s_ease-in-out_infinite] rounded-full bg-lime-300/40 blur-[120px]" />
        <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
      </div>

      <div className="container-page relative text-center">
        <div style={enter(0)} className="mx-auto inline-flex items-center gap-3 rounded-full border border-ink-100 bg-white/80 py-1.5 pl-1.5 pr-4 text-[13px] text-ink-600 shadow-sm backdrop-blur">
          <span className="flex -space-x-1.5" aria-hidden="true">
            {["from-lime-300 to-brand-500", "from-sky-300 to-brand-600", "from-brand-200 to-sky-500"].map((g) => (
              <span key={g} className={`size-6 rounded-full border-2 border-white bg-gradient-to-br ${g}`} />
            ))}
          </span>
          <span className="flex items-center gap-1 font-semibold text-ink-900">
            <Star className="size-3.5 fill-lime-400 text-lime-500" aria-hidden="true" /> 4.8
          </span>
          <span className="hidden sm:inline">Loved by 4,000+ phone teams</span>
        </div>

        <h1 style={enter(120)} className="mx-auto mt-7 max-w-6xl text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.035em] text-ink-900 sm:text-[3.6rem] lg:text-[4.2rem]">
          <span className="block">The phone system that</span>
          <span className="block">helps your team</span>
          <WordRotator
            words={["sell more.", "support better.", "answer every call.", "work with AI."]}
            className="block pb-2"
            wordClassName="text-gradient"
          />
        </h1>

        <p style={enter(240)} className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-500 text-pretty sm:text-xl">
          Calling, routing, analytics and AI voice agents in one beautifully simple workspace. Live in five minutes, no hardware needed.
        </p>

        <div style={enter(360)} className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/signup" variant="dark" size="lg" className="group">
            Start free for 14 days
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href="/demo" variant="outline" size="lg">
            Book a demo
          </ButtonLink>
        </div>

        <div style={enter(480)} className="mt-8">
          <p className="mb-3 text-[13px] font-medium text-ink-500">Or hear our AI agent for yourself. Enter your number:</p>
          <CallMeBar />
        </div>
      </div>

      <div style={enter(600)} className="container-page relative mt-16 pb-12 sm:mt-20">
        <HeroScene />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-20 bg-gradient-to-t from-white to-transparent" aria-hidden="true" />
      </div>

      <div className="container-page relative pb-6 pt-4">
        <LogoStrip />
      </div>
    </section>
  );
}
