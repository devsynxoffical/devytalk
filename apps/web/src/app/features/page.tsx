import type { Metadata } from "next";
import { featureGroups, features } from "@/content/features";
import { PageHero } from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { FeatureCard } from "@/components/sections/FeatureCard";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata: Metadata = {
  title: "Features",
  description: "Dialers, IVR, smart routing, call recording, analytics and AI. Explore every DevyTalk feature.",
};

const groupCopy: Record<string, string> = {
  Calling: "Make and take calls from anywhere, on any device.",
  Routing: "Send every caller to the right person, first time.",
  Insights: "See what is happening on the phones and why.",
  AI: "Automate the busywork and coach every rep.",
};

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Everything you need to run a modern phone team"
        description="One platform for calling, routing, insights and AI, built to work together from day one."
      >
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/signup" variant="accent" size="lg">Start free trial</ButtonLink>
          <ButtonLink href="/pricing" variant="light" size="lg">See pricing</ButtonLink>
        </div>
      </PageHero>
      <div className="container-page space-y-20 py-20">
        {featureGroups.map((group) => (
          <section key={group} aria-labelledby={`group-${group}`}>
            <div className="flex flex-col justify-between gap-2 border-b border-ink-200 pb-4 sm:flex-row sm:items-end">
              <h2 id={`group-${group}`} className="text-2xl font-extrabold tracking-tight">{group}</h2>
              <p className="text-ink-500">{groupCopy[group]}</p>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.filter((f) => f.group === group).map((f) => (
                <FeatureCard key={f.slug} feature={f} />
              ))}
            </div>
          </section>
        ))}
      </div>
      <CtaBand />
    </>
  );
}
