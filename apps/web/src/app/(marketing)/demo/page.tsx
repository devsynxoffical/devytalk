import type { Metadata } from "next";
import { CalendarCheck, Headset, MessageCircle, Star } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LeadForm } from "@/components/interactive/LeadForm";
import { LogoStrip } from "@/components/sections/LogoStrip";

export const metadata: Metadata = { title: "Book a demo", description: "See DevyTalk in action with a product specialist." };

const points = [
  { icon: CalendarCheck, text: "A 30-minute walkthrough tailored to your team" },
  { icon: Headset, text: "Live Q&A with a calling specialist" },
  { icon: MessageCircle, text: "Pricing and a rollout plan for your use case" },
];

export default function DemoPage() {
  return (
    <>
      <section className="relative overflow-hidden pb-16 pt-36 sm:pt-44">
        <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_60%)]" aria-hidden="true" />
        <div className="absolute -left-40 top-10 size-[36rem] rounded-full bg-gradient-to-br from-brand-200/70 via-sky-300/30 to-lime-300/50 blur-3xl" aria-hidden="true" />
        <div className="container-page relative grid grid-cols-1 [&>*]:min-w-0 items-start gap-14 lg:grid-cols-2">
          <div className="lg:pt-6">
            <Eyebrow>Book a demo</Eyebrow>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl">See how DevyTalk fits your team</h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-500">
              Tell us a little about your team and we&apos;ll set up a personalised demo, usually within one business day.
            </p>
            <ul className="mt-10 space-y-4">
              {points.map((p) => {
                const Icon = p.icon;
                return (
                  <li key={p.text} className="flex items-center gap-3 text-ink-700">
                    <span className="grid size-10 place-items-center rounded-xl border border-brand-100 bg-white text-brand-700 shadow-sm">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    {p.text}
                  </li>
                );
              })}
            </ul>
            <figure className="shadow-card mt-12 max-w-lg rounded-2xl border border-ink-100 bg-white p-6">
              <p className="flex gap-0.5" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="size-4 fill-lime-400 text-lime-500" aria-hidden="true" />
                ))}
              </p>
              <blockquote className="mt-3 text-ink-700">“The demo was the most useful 30 minutes of our evaluation. We were live the same week.”</blockquote>
              <figcaption className="mt-3 text-sm text-ink-500">Sofia Lindqvist, COO at Orbitly</figcaption>
            </figure>
          </div>
          <div className="shadow-float rounded-[1.75rem] border border-ink-100 bg-white p-6 sm:p-10">
            <h2 className="mb-6 text-xl font-semibold">Request your demo</h2>
            <LeadForm kind="demo" />
          </div>
        </div>
      </section>
      <div className="container-page pb-20">
        <LogoStrip />
      </div>
    </>
  );
}
