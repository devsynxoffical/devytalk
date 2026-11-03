import type { Metadata } from "next";
import { Heart, Lightbulb, Scale, Zap } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata: Metadata = { title: "About us", description: "Why we are building DevyTalk and the values behind it." };

const values = [
  { icon: Heart, title: "Customers first", body: "Every roadmap decision starts with a real conversation with a real team." },
  { icon: Zap, title: "Fast by default", body: "Setup in minutes, pages in milliseconds, answers in hours." },
  { icon: Scale, title: "Fair and transparent", body: "Clear prices, no surprise fees and no lock-in contracts." },
  { icon: Lightbulb, title: "Useful AI", body: "AI that removes work, not AI for a slide deck." },
];

const timeline = [
  { year: "2023", text: "DevyTalk is founded by a small team of engineers who built call centers for a living." },
  { year: "2024", text: "First 500 customers. Power Dialer and the IVR builder launch." },
  { year: "2025", text: "Numbers in 100+ countries. Conversation Intelligence goes live." },
  { year: "2026", text: "4,000+ teams. Launch of the AI Voice Agent." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About DevyTalk"
        title="We believe the phone is still the fastest way to build trust"
        description="Our mission is to give every team the calling tools that used to be reserved for enterprise call centers, without the complexity."
      />
      <section className="container-page py-20">
        <SectionHeading eyebrow="Our values" title="How we work" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="rounded-3xl border border-ink-200 bg-white p-7">
                <Icon className="size-7 text-brand-600" aria-hidden="true" />
                <h3 className="mt-4 font-bold">{v.title}</h3>
                <p className="mt-2 text-sm text-ink-500">{v.body}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="bg-white py-20">
        <div className="container-page max-w-3xl">
          <SectionHeading eyebrow="Our story" title="From side project to 4,000 teams" />
          <ol className="mt-12 space-y-8 border-l-2 border-brand-200 pl-8">
            {timeline.map((t) => (
              <li key={t.year} className="relative">
                <span className="absolute -left-[2.6rem] top-1 size-4 rounded-full border-4 border-white bg-brand-500" aria-hidden="true" />
                <p className="font-mono text-sm font-bold text-brand-700">{t.year}</p>
                <p className="mt-1 text-lg text-ink-700">{t.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <CtaBand title="Want to build the future of calling with us?" description="We are hiring engineers, designers and customer success managers." />
    </>
  );
}
