import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { features, getFeature } from "@/content/features";
import { PageHero } from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { FeatureCard } from "@/components/sections/FeatureCard";
import { LogoStrip } from "@/components/sections/LogoStrip";
import { Testimonials } from "@/components/sections/Testimonials";
import { CtaBand } from "@/components/sections/CtaBand";
import { Softphone } from "@/components/interactive/Softphone";
import {
  AgentBuilderMockup,
  DialerMockup,
  FollowUpMockup,
  RoutingMockup,
  ScorecardMockup,
  SupervisorMockup,
} from "@/components/home/Mockups";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return features.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const feature = getFeature((await params).slug);
  return feature ? { title: feature.name, description: feature.short } : {};
}

const visuals: Record<string, () => ReactNode> = {
  "power-dialer": () => <DialerMockup />,
  "parallel-dialer": () => <DialerMockup />,
  ivr: () => <RoutingMockup />,
  "smart-routing": () => <RoutingMockup />,
  analytics: () => <SupervisorMockup />,
  "ai-voice-agent": () => <AgentBuilderMockup />,
  "conversation-intelligence": () => <ScorecardMockup />,
  "ai-coaching": () => <ScorecardMockup />,
  "sms-whatsapp": () => <FollowUpMockup />,
  "call-recording": () => <ScorecardMockup />,
};

export default async function FeaturePage({ params }: Props) {
  const feature = getFeature((await params).slug);
  if (!feature) notFound();
  const Icon = feature.icon;
  const related = features.filter((f) => f.slug !== feature.slug && (f.group === feature.group || f.group === "AI")).slice(0, 3);
  const visual = visuals[feature.slug];

  return (
    <>
      <PageHero eyebrow={feature.name} title={feature.headline} description={feature.intro}>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/signup" size="lg">
            Try it free <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href="/demo" variant="outline" size="lg">
            See it in a demo
          </ButtonLink>
        </div>
      </PageHero>

      <section className="container-page">
        <Reveal>
          <div className="bg-mesh-light overflow-hidden rounded-[1.75rem] border border-ink-100 px-3 pt-8 sm:px-10 sm:pt-12 lg:px-20">
            {visual ? (
              <div className="relative mx-auto h-[25rem] max-w-4xl sm:h-[27rem]">{visual()}</div>
            ) : (
              <div className="pb-10">
                <Softphone />
              </div>
            )}
          </div>
        </Reveal>
      </section>

      <section className="container-page grid grid-cols-1 [&>*]:min-w-0 items-start gap-10 py-16 sm:py-24 lg:grid-cols-[1fr_1.5fr]">
        <div className="shadow-card rounded-[1.75rem] border border-ink-100 bg-white p-8 lg:sticky lg:top-28">
          <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-8 text-6xl font-semibold tracking-tight text-gradient">{feature.stat.value}</p>
          <p className="mt-2 text-lg text-ink-700">{feature.stat.label}</p>
          <p className="mt-6 border-t border-ink-100 pt-5 text-xs text-ink-400">Median result reported by DevyTalk customers in their first 90 days.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {feature.highlights.map((h, i) => (
            <Reveal key={h.title} delay={i * 80}>
              <div className="h-full rounded-[1.5rem] border border-ink-100 bg-white p-7">
                <CheckCircle2 className="size-6 text-brand-600" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold">{h.title}</h2>
                <p className="mt-2 leading-relaxed text-ink-500">{h.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="container-page">
        <LogoStrip />
      </div>
      <Testimonials />

      {related.length > 0 && (
        <section className="container-page py-16 sm:py-24">
          <SectionHeading title="Works great with" />
          <div className="mt-12 grid grid-cols-1 [&>*]:min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
