import type { Metadata } from "next";
import { integrations } from "@/content/integrations";
import { PageHero } from "@/components/ui/PageHero";
import { AppIcon } from "@/components/brand/AppIcon";
import { IntegrationsBrowser } from "@/components/interactive/IntegrationsBrowser";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Connect DevyTalk to your CRM, helpdesk, e-commerce store and automation tools.",
};

export default function IntegrationsPage() {
  const ring = integrations.filter((i) => i.popular);
  return (
    <>
      <PageHero
        eyebrow="Integrations"
        title="Plug DevyTalk into your stack"
        description="Native integrations with the CRMs and helpdesks your team lives in, plus an open API and webhooks for everything else."
      >
        <ul className="mx-auto flex max-w-2xl flex-wrap justify-center gap-3">
          {ring.map((i, k) => (
            <li key={i.name} className="animate-[fadeIn_.5s_ease_both]" style={{ animationDelay: `${k * 60}ms` }}>
              <AppIcon icon={i.icon} name={i.name} color={i.color} size="lg" />
            </li>
          ))}
        </ul>
      </PageHero>
      <section className="container-page pb-16 sm:pb-24">
        <IntegrationsBrowser />
      </section>
      <CtaBand title="Missing an integration?" description="Tell us what you use. Our API and webhooks can usually connect it today." />
    </>
  );
}
