"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { integrations } from "@/content/integrations";
import { AppIcon } from "@/components/brand/AppIcon";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

const TABS: { label: string; names: string[] }[] = [
  {
    label: "Sales & commerce",
    names: ["Salesforce", "HubSpot", "Pipedrive", "Zoho CRM", "Microsoft Dynamics", "Odoo", "Airtable", "Shopify", "WooCommerce", "BigCommerce", "Stripe", "Gmail", "Google Calendar", "Slack", "Zapier", "Make"],
  },
  {
    label: "Customer support",
    names: ["Zendesk", "Freshdesk", "Intercom", "Help Scout", "Gorgias", "Jira Service", "Linear", "Shopify", "Slack", "Microsoft Teams", "WhatsApp", "Notion", "Asana", "Gmail", "HubSpot", "Salesforce"],
  },
  {
    label: "Automation & data",
    names: ["Zapier", "Make", "n8n", "Webhooks", "REST API", "Google Sheets", "Google Analytics", "Airtable", "Notion", "Mailchimp", "Stripe", "Slack", "Asana", "Linear", "Google Calendar", "HubSpot"],
  },
];

export function IntegrationsTabs() {
  const [tab, setTab] = useState(0);
  const items = TABS[tab].names.map((n) => integrations.find((i) => i.name === n)).filter((i) => i !== undefined);

  return (
    <section className="container-page py-16 sm:py-24">
      <SectionHeading
        eyebrow="Integrations"
        title="Works with the stack you already have"
        description="Connect your CRM in two clicks and never copy a phone number again. 100+ native integrations, plus Zapier, Make, webhooks and an open API."
      />
      <div role="tablist" aria-label="Integration categories" className="mx-auto mt-12 grid max-w-4xl grid-cols-3 border-b border-ink-100">
        {TABS.map((t, i) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={tab === i}
            onClick={() => setTab(i)}
            className={cn(
              "relative pb-4 text-[13px] font-semibold transition-colors sm:text-[15px]",
              tab === i ? "text-brand-700" : "text-ink-400 hover:text-ink-700",
            )}
          >
            {t.label}
            <span className={cn("absolute inset-x-0 -bottom-px h-0.5 rounded-full", tab === i ? "bg-brand-600" : "bg-transparent")} />
          </button>
        ))}
      </div>
      <ul key={tab} role="tabpanel" className="mx-auto mt-12 grid max-w-3xl grid-cols-4 justify-items-center gap-4 sm:grid-cols-8 sm:gap-5">
        {items.map((i, idx) => (
          <li key={i.name} className="group relative animate-[fadeIn_.4s_ease_both]" style={{ animationDelay: `${idx * 25}ms` }}>
            <AppIcon icon={i.icon} name={i.name} color={i.color} size="lg" className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105" />
            <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              {i.name}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-12 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/demo">Contact sales</ButtonLink>
        <ButtonLink href="/integrations" variant="outline">
          See all integrations <ArrowRight className="size-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    </section>
  );
}
