import type { Metadata } from "next";
import { caseStudies } from "@/content/social";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { CustomerLogo } from "@/components/brand/CustomerLogos";
import { LogoStrip } from "@/components/sections/LogoStrip";
import { Testimonials } from "@/components/sections/Testimonials";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata: Metadata = { title: "Customer stories", description: "How sales and support teams use DevyTalk." };

export default function CustomersPage() {
  return (
    <>
      <PageHero eyebrow="Customer stories" title="Teams doing their best work on the phone" description="From five-person startups to multi-site support floors." />
      <div className="container-page">
        <LogoStrip />
      </div>
      <section className="container-page grid grid-cols-1 [&>*]:min-w-0 gap-5 py-16 sm:py-24 md:grid-cols-2">
        {caseStudies.map((c, i) => (
          <Reveal key={c.company} delay={(i % 2) * 100}>
            <article className="shadow-card flex h-full flex-col rounded-[1.75rem] border border-ink-100 bg-white p-8">
              <div className="flex items-center justify-between gap-4">
                <CustomerLogo name={c.company} />
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{c.industry}</span>
              </div>
              <p className="mt-6 flex-1 text-lg leading-relaxed text-ink-600">{c.summary}</p>
              <dl className="mt-8 grid grid-cols-2 gap-3">
                {c.results.map((r) => (
                  <div key={r.label} className="rounded-2xl bg-gradient-to-br from-brand-50 to-sky-300/10 p-4">
                    <dd className="text-3xl font-semibold tracking-tight text-ink-900">{r.value}</dd>
                    <dt className="text-sm text-ink-500">{r.label}</dt>
                  </div>
                ))}
              </dl>
            </article>
          </Reveal>
        ))}
      </section>
      <Testimonials />
      <CtaBand />
    </>
  );
}
