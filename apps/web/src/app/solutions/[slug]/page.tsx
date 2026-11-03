import { CountUp } from "@/components/ui/CountUp";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Check, X } from "lucide-react";
import { features } from "@/content/features";
import { getSolution, solutions } from "@/content/solutions";
import { PageHero } from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { FeatureCard } from "@/components/sections/FeatureCard";
import { LogoStrip } from "@/components/sections/LogoStrip";
import { Testimonials } from "@/components/sections/Testimonials";
import { IntegrationsTabs } from "@/components/sections/IntegrationsTabs";
import { CtaBand } from "@/components/sections/CtaBand";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return solutions.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getSolution((await params).slug);
  return s ? { title: `DevyTalk for ${s.name}`, description: s.short } : {};
}

export default async function SolutionPage({ params }: Props) {
  const solution = getSolution((await params).slug);
  if (!solution) notFound();
  const used = features.filter((f) => solution.featureSlugs.includes(f.slug));
  const Icon = solution.icon;

  return (
    <>
      <PageHero eyebrow={`For ${solution.name.toLowerCase()}`} title={solution.headline} description={solution.intro}>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/signup" size="lg">
            Start free trial <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href="/demo" variant="outline" size="lg">
            Talk to an expert
          </ButtonLink>
        </div>
        <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
          {solution.kpis.map((k) => (
            <div key={k.label} className="shadow-card rounded-2xl border border-ink-100 bg-white p-5">
              <dd className="text-3xl font-semibold tracking-tight text-ink-900"><CountUp value={k.value} /></dd>
              <dt className="mt-1 text-sm text-ink-500">{k.label}</dt>
            </div>
          ))}
        </dl>
      </PageHero>

      <div className="container-page">
        <LogoStrip />
      </div>

      <section className="container-page py-16 sm:py-24">
        <SectionHeading layout="split" title="Before and after DevyTalk" description={`What changes for ${solution.name.toLowerCase()} in the first month.`} />
        <div className="mt-12 grid grid-cols-1 [&>*]:min-w-0 gap-5 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-[1.75rem] border border-ink-100 bg-white p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-400">Without DevyTalk</p>
              <ul className="mt-6 space-y-4">
                {solution.pains.map((p) => (
                  <li key={p} className="flex gap-3 text-ink-700">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-red-50 text-red-500">
                      <X className="size-3.5" aria-hidden="true" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="bg-mesh-dark h-full rounded-[1.75rem] p-8 text-white">
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-lime-300">
                <Icon className="size-4" aria-hidden="true" /> With DevyTalk
              </p>
              <ul className="mt-6 space-y-4">
                {used.map((f) => (
                  <li key={f.slug} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-lime-400 text-ink-900">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="font-semibold">{f.name}:</span> <span className="text-white/75">{f.short}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-page pb-16 sm:pb-24">
        <SectionHeading title="The features your team will use every day" />
        <div className="mt-12 grid grid-cols-1 [&>*]:min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {used.map((f) => (
            <FeatureCard key={f.slug} feature={f} />
          ))}
        </div>
      </section>

      <Testimonials />
      <IntegrationsTabs />
      <CtaBand />
    </>
  );
}
