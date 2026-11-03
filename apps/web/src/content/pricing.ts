export type Plan = {
  id: "starter" | "growth" | "scale" | "enterprise";
  name: string;
  monthly: number | null;
  description: string;
  cta: string;
  highlighted?: boolean;
  includes: string[];
};

/** Annual billing discount applied to monthly list prices. */
export const ANNUAL_DISCOUNT = 0.2;

export const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthly: 25,
    description: "For small teams getting a professional line in place.",
    cta: "Start free trial",
    includes: ["Unlimited inbound calls", "1 local number included", "Browser & mobile apps", "Basic IVR", "Call recording (30 days)", "Email support"],
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 39,
    description: "For sales and support teams that live on the phone.",
    cta: "Start free trial",
    highlighted: true,
    includes: ["Everything in Starter", "Power Dialer", "Smart routing & queues", "CRM integrations", "Live wallboards", "Unlimited recording storage"],
  },
  {
    id: "scale",
    name: "Scale",
    monthly: 59,
    description: "For teams that want AI insights and automation.",
    cta: "Start free trial",
    includes: ["Everything in Growth", "Parallel Dialer", "Conversation Intelligence", "AI coaching scorecards", "Whisper & barge", "Priority support"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthly: null,
    description: "For large or regulated organisations.",
    cta: "Talk to sales",
    includes: ["Everything in Scale", "SSO (SAML) & SCIM", "Data residency (EU/US)", "99.99% uptime SLA", "Dedicated success manager", "Custom contracts"],
  },
];

export type ComparisonRow = { label: string; values: [boolean | string, boolean | string, boolean | string, boolean | string] };

export const comparison: { group: string; rows: ComparisonRow[] }[] = [
  {
    group: "Calling",
    rows: [
      { label: "Inbound & outbound calling", values: [true, true, true, true] },
      { label: "Included numbers", values: ["1", "2", "3", "Custom"] },
      { label: "Power Dialer", values: [false, true, true, true] },
      { label: "Parallel Dialer", values: [false, false, true, true] },
      { label: "SMS & WhatsApp", values: [true, true, true, true] },
    ],
  },
  {
    group: "Routing",
    rows: [
      { label: "IVR builder", values: ["Basic", "Advanced", "Advanced", "Advanced"] },
      { label: "Skill-based routing", values: [false, true, true, true] },
      { label: "Business hours & holidays", values: [true, true, true, true] },
    ],
  },
  {
    group: "Insights & AI",
    rows: [
      { label: "Call recording retention", values: ["30 days", "Unlimited", "Unlimited", "Custom"] },
      { label: "Live wallboards", values: [false, true, true, true] },
      { label: "Transcripts & AI summaries", values: [false, false, true, true] },
      { label: "AI coaching", values: [false, false, true, true] },
      { label: "AI Voice Agent", values: ["Add-on", "Add-on", "Add-on", "Included"] },
    ],
  },
  {
    group: "Security & support",
    rows: [
      { label: "Two-factor authentication", values: [true, true, true, true] },
      { label: "SSO & SCIM", values: [false, false, false, true] },
      { label: "Support", values: ["Email", "Email & chat", "Priority", "Dedicated CSM"] },
    ],
  },
];

export function planPrice(monthly: number, annual: boolean) {
  return annual ? Math.round(monthly * (1 - ANNUAL_DISCOUNT)) : monthly;
}
