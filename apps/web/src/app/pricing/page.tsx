import type { Metadata } from "next";
import { pricingFaq } from "@/content/faq";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PricingTable } from "@/components/interactive/PricingTable";
import { RoiCalculator } from "@/components/interactive/RoiCalculator";
import { LogoStrip } from "@/components/sections/LogoStrip";
import { FaqWithContact } from "@/components/sections/FaqWithContact";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple per-user pricing for DevyTalk. Start free for 14 days, no credit card required.",
};

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Simple pricing that grows with your team"
        description="Pay per user, per month. Every plan includes a 14-day free trial, unlimited inbound calls and free number porting."
      />
      <section className="container-page pb-16">
        <PricingTable />
      </section>
      <div className="container-page py-10">
        <LogoStrip />
      </div>
      <section className="container-page py-16 sm:py-24">
        <SectionHeading
          eyebrow="ROI calculator"
          title="How much time could your team win back?"
          description="Move the sliders to estimate the impact of replacing manual dialing with the Power Dialer."
        />
        <div className="mt-12">
          <RoiCalculator />
        </div>
      </section>
      <FaqWithContact items={pricingFaq} title="Pricing questions" />
      <CtaBand title="Not sure which plan fits?" description="Book a 20-minute call and we'll recommend the right setup for your team." />
    </>
  );
}
