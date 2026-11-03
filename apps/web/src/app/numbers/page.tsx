import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { NumbersBrowser } from "@/components/interactive/NumbersBrowser";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata: Metadata = {
  title: "Phone numbers",
  description: "Local, mobile and toll-free numbers in 140+ countries. See coverage and monthly prices.",
};

export default function NumbersPage() {
  return (
    <>
      <PageHero
        eyebrow="Global numbers"
        title="Local numbers wherever your customers are"
        description="Buy numbers instantly or port your existing ones for free. Prices below are per number, per month."
      />
      <section className="container-page py-16">
        <NumbersBrowser />
        <p className="mt-4 text-xs text-ink-400">Showing a selection of popular countries. Some numbers require local address or identity documents.</p>
      </section>
      <CtaBand />
    </>
  );
}
