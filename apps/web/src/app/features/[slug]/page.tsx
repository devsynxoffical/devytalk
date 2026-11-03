import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { features, getFeature } from "@/content/features";
import { PageHero } from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FeatureCard } from "@/components/sections/FeatureCard";
import { CtaBand } from "@/components/sections/CtaBand";
import { LogoCloud } from "@/components/sections/LogoCloud";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return features.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const feature = getFeature((await params).slug);
  return feature ? { title: feature.name, description: feature.short } : {};
}

export default async function FeaturePage({ params }: Props) {
  const feature = getFeature((await params).slug);
  if (!feature) notFound();
  const Icon = feature.icon;
  const related = features.filter((f) => f.group === feature.group && f.slug !== feature.slug).slice(0, 3);

  return (
    <>
      <PageHero eyebrow={feature.name} title={feature.headline} description={feature.intro}>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/signup" variant="accent" size="lg">Try it free</ButtonLink>
          <ButtonLink href="/demo" variant="light" size="lg">See it in a demo</ButtonLink>
        </div>
      </PageHero>

      <section className="container-page grid items-start gap-12 py-20 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-3xl bg-ink-900 p-10 text-white lg:sticky lg:top-28">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-500/20 text-brand-300">
            <Icon className="size-7" aria-hidden="true" />
          </span>
          <p className="mt-10 text-6xl font-extrabold text-gradient">{feature.stat.value}</p>
          <p className="mt-2 text-lg text-ink-300">{feature.stat.label}</p>
          <p className="mt-8 text-xs text-ink-500">Based on median results reported by DevyTalk customers.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {feature.highlights.map((h) => (
            <div key={h.title} className="rounded-3xl border border-ink-200 bg-white p-7">
              <CheckCircle2 className="size-6 text-brand-600" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-bold">{h.title}</h2>
              <p className="mt-2 text-ink-500">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-page">
          <LogoCloud />
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-page py-20">
          <SectionHeading title="Works great with" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((f) => (
              <FeatureCard key={f.slug} feature={f} />
            ))}
          </div>
        </section>
      )}
      <CtaBand title={`Try ${feature.name} free for 14 days`} />
    </>
  );
}
