import type { Metadata } from "next";
import { caseStudies } from "@/content/social";
import { PageHero } from "@/components/ui/PageHero";
import { LogoCloud } from "@/components/sections/LogoCloud";
import { Testimonials } from "@/components/sections/Testimonials";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata: Metadata = { title: "Customer stories", description: "How sales and support teams use DevyTalk." };

export default function CustomersPage() {
  return (
    <>
      <PageHero eyebrow="Customer stories" title="Teams doing their best work on the phone" description="From five-person startups to multi-site support floors." />
      <section className="bg-white py-14">
        <div className="container-page">
          <LogoCloud />
        </div>
      </section>
      <section className="container-page grid gap-6 py-20 md:grid-cols-2">
        {caseStudies.map((c) => (
          <article key={c.company} className="flex flex-col rounded-3xl border border-ink-200 bg-white p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{c.industry}</p>
            <h2 className="mt-2 text-2xl font-extrabold">{c.company}</h2>
            <p className="mt-3 flex-1 text-ink-500">{c.summary}</p>
            <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-ink-100 pt-6">
              {c.results.map((r) => (
                <div key={r.label}>
                  <dd className="text-3xl font-extrabold text-ink-900">{r.value}</dd>
                  <dt className="text-sm text-ink-500">{r.label}</dt>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </section>
      <Testimonials />
      <CtaBand />
    </>
  );
}
