import type { Metadata } from "next";
import { CalendarCheck, Headset, MessageCircle } from "lucide-react";
import { LeadForm } from "@/components/interactive/LeadForm";
import { LogoCloud } from "@/components/sections/LogoCloud";

export const metadata: Metadata = { title: "Book a demo", description: "See DevyTalk in action with a product specialist." };

const points = [
  { icon: CalendarCheck, text: "A 30-minute walkthrough tailored to your team" },
  { icon: Headset, text: "Live Q&A with a calling specialist" },
  { icon: MessageCircle, text: "Pricing and setup plan for your use case" },
];

export default function DemoPage() {
  return (
    <section className="relative overflow-hidden bg-ink-900 pb-20 pt-32 sm:pt-40">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden="true" />
      <div className="container-page relative grid items-start gap-14 lg:grid-cols-2">
        <div className="text-white">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-300">Book a demo</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">See how DevyTalk fits your team</h1>
          <p className="mt-5 max-w-lg text-lg text-ink-300">Tell us a little about your team and we will set up a personalised demo, usually within one business day.</p>
          <ul className="mt-10 space-y-4">
            {points.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.text} className="flex items-center gap-3 text-ink-200">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  {p.text}
                </li>
              );
            })}
          </ul>
          <div className="mt-14 hidden lg:block">
            <LogoCloud inverted label="Join teams like" />
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-2xl sm:p-10">
          <LeadForm kind="demo" />
        </div>
      </div>
    </section>
  );
}
