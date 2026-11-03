import type { Metadata } from "next";
import { pricingFaq } from "@/content/faq";
import { PageHero } from "@/components/ui/PageHero";
import { FaqList } from "@/components/ui/FaqList";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PricingTable } from "@/components/interactive/PricingTable";
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
      <section className="container-page -mt-6 py-16">
        <PricingTable />
      </section>
      <section className="container-page py-16">
        <SectionHeading title="Pricing questions" />
        <div className="mt-10">
          <FaqList items={pricingFaq} />
        </div>
      </section>
      <CtaBand title="Not sure which plan fits?" description="Book a 20-minute call and we will recommend the right setup for your team." />
    </>
  );
}
