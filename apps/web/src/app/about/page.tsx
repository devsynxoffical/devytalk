import { CountUp } from "@/components/ui/CountUp";
import type { Metadata } from "next";
import { Heart, Lightbulb, Scale, Zap } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { LogoStrip } from "@/components/sections/LogoStrip";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata: Metadata = { title: "About us", description: "Why we are building DevyTalk and the values behind it." };

const values = [
  { icon: Heart, title: "Customers first", body: "Every roadmap decision starts with a real conversation with a real team." },
  { icon: Zap, title: "Fast by default", body: "Setup in minutes, pages in milliseconds, answers in hours." },
  { icon: Scale, title: "Fair and transparent", body: "Clear prices, no surprise fees and no lock-in contracts." },
  { icon: Lightbulb, title: "Useful AI", body: "AI that removes work from your team's day, not AI for a slide deck." },
];

const numbers = [
  { value: "4,000+", label: "teams calling every day" },
  { value: "90", label: "countries with customers" },
  { value: "120", label: "people across 7 offices" },
  { value: "38M", label: "minutes connected last year" },
];

const timeline = [
  { year: "2023", text: "DevyTalk is founded by a small team of engineers who used to build call centers for a living." },
  { year: "2024", text: "First 500 customers. The Power Dialer and visual IVR builder launch." },
  { year: "2025", text: "Numbers in 100+ countries. Conversation Intelligence goes live." },
  { year: "2026", text: "4,000+ teams. Launch of the AI Voice Agent." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About DevyTalk"
        title="The phone is still the fastest way to build trust"
        description="Our mission is to give every team the calling tools that used to be reserved for enterprise call centers, without the complexity."
      />
      <section className="container-page">
        <dl className="grid grid-cols-1 [&>*]:min-w-0 grid-cols-2 gap-4 lg:grid-cols-4">
          {numbers.map((n) => (
            <div key={n.label} className="shadow-card rounded-2xl border border-ink-100 bg-white p-6">
              <dd className="text-4xl font-semibold tracking-tight text-ink-900"><CountUp value={n.value} /></dd>
              <dt className="mt-1 text-sm text-ink-500">{n.label}</dt>
            </div>
          ))}
        </dl>
      </section>
      <section className="container-page py-16 sm:py-24">
        <SectionHeading layout="split" eyebrow="Our values" title="How we work" description="Four principles guide how we build the product and how we treat the people who use it." />
        <div className="mt-12 grid grid-cols-1 [&>*]:min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <Reveal key={v.title} delay={i * 80}>
                <div className="h-full rounded-[1.5rem] border border-ink-100 bg-white p-7">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-semibold">{v.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{v.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
      <section className="container-page py-16 sm:py-24">
        <div className="grid grid-cols-1 [&>*]:min-w-0 gap-12 lg:grid-cols-2">
          <SectionHeading layout="left" eyebrow="Our story" title="From side project to 4,000 teams" />
          <ol className="space-y-8 border-l-2 border-brand-100 pl-8">
            {timeline.map((t) => (
              <li key={t.year} className="relative">
                <span className="absolute -left-[2.6rem] top-1 size-4 rounded-full border-4 border-white bg-brand-500 ring-2 ring-brand-200" aria-hidden="true" />
                <p className="font-mono text-sm font-semibold text-brand-700">{t.year}</p>
                <p className="mt-1 text-lg text-ink-700">{t.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <div className="container-page">
        <LogoStrip />
      </div>
      <CtaBand title="Want to build the future of calling with us?" description="We're hiring engineers, designers and customer success managers." />
    </>
  );
}
