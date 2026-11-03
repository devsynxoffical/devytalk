import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { XCircle } from "lucide-react";
import { features } from "@/content/features";
import { getSolution, solutions } from "@/content/solutions";
import { PageHero } from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FeatureCard } from "@/components/sections/FeatureCard";
import { Testimonials } from "@/components/sections/Testimonials";
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

  return (
    <>
      <PageHero eyebrow={`For ${solution.name.toLowerCase()}`} title={solution.headline} description={solution.intro}>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/signup" variant="accent" size="lg">Start free trial</ButtonLink>
          <ButtonLink href="/demo" variant="light" size="lg">Talk to an expert</ButtonLink>
        </div>
        <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {solution.kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <dd className="text-3xl font-extrabold text-gradient">{k.value}</dd>
              <dt className="mt-1 text-sm text-ink-300">{k.label}</dt>
            </div>
          ))}
        </dl>
      </PageHero>

      <section className="container-page grid gap-12 py-20 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <SectionHeading align="left" eyebrow="The problem" title="Sound familiar?" />
          <ul className="mt-8 space-y-4">
            {solution.pains.map((p) => (
              <li key={p} className="flex gap-3 rounded-2xl border border-ink-200 bg-white p-4 text-ink-700">
                <XCircle className="mt-0.5 size-5 shrink-0 text-red-400" aria-hidden="true" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionHeading align="left" eyebrow="The fix" title="What your team gets" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {used.map((f) => (
              <FeatureCard key={f.slug} feature={f} />
            ))}
          </div>
        </div>
      </section>
      <Testimonials />
      <CtaBand />
    </>
  );
}
