import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { IntegrationsBrowser } from "@/components/interactive/IntegrationsBrowser";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Connect DevyTalk to your CRM, helpdesk, e-commerce store and automation tools.",
};

export default function IntegrationsPage() {
  return (
    <>
      <PageHero
        eyebrow="Integrations"
        title="Plug DevyTalk into your stack"
        description="Native integrations with the CRMs and helpdesks your team lives in, plus an open API and webhooks for everything else."
      />
      <section className="container-page py-16">
        <IntegrationsBrowser />
      </section>
      <CtaBand title="Missing an integration?" description="Tell us what you use. Our API and webhooks can usually connect it today." />
    </>
  );
}
