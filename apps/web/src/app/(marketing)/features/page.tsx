import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { featureGroups, features } from "@/content/features";
import { PageHero } from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { FeatureCard } from "@/components/sections/FeatureCard";
import { LogoStrip } from "@/components/sections/LogoStrip";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata: Metadata = {
  title: "Features",
  description: "Dialers, IVR, smart routing, call recording, analytics and AI. Explore every DevyTalk feature.",
};

const groupCopy: Record<string, string> = {
  Calling: "Make and take calls from anywhere, on any device.",
  Routing: "Send every caller to the right person, first time.",
  Insights: "See what is happening on the phones, and why.",
  AI: "Automate the busywork and coach every rep.",
};

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Platform features"
        title="Everything you need to run a modern phone team"
        description="One platform for calling, routing, insights and AI, built to work together from day one."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/signup" size="lg">
            Start free trial <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href="/pricing" variant="outline" size="lg">
            See pricing
          </ButtonLink>
        </div>
      </PageHero>
      <div className="container-page pb-6">
        <LogoStrip />
      </div>
      <div className="container-page space-y-20 py-16 sm:py-24">
        {featureGroups.map((group) => (
          <Reveal key={group}>
            <section aria-labelledby={`group-${group}`}>
              <div className="flex flex-col justify-between gap-2 border-b border-ink-100 pb-5 sm:flex-row sm:items-end">
                <h2 id={`group-${group}`} className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {group}
                </h2>
                <p className="text-ink-500">{groupCopy[group]}</p>
              </div>
              <div className="mt-8 grid grid-cols-1 [&>*]:min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {features
                  .filter((f) => f.group === group)
                  .map((f) => (
                    <FeatureCard key={f.slug} feature={f} />
                  ))}
              </div>
            </section>
          </Reveal>
        ))}
      </div>
      <CtaBand />
    </>
  );
}
