import { Briefcase, HeartHandshake, Rocket, ShoppingBag, Building2, Stethoscope, type LucideIcon } from "lucide-react";

export type Solution = {
  slug: string;
  name: string;
  icon: LucideIcon;
  short: string;
  headline: string;
  intro: string;
  pains: string[];
  featureSlugs: string[];
  kpis: { value: string; label: string }[];
};

export const solutions: Solution[] = [
  {
    slug: "sales",
    name: "Sales teams",
    icon: Briefcase,
    short: "More conversations, cleaner CRM data, faster pipeline.",
    headline: "Give your reps more time to sell",
    intro: "Automate the dialing, the logging and the follow-up so reps spend their day in conversations, not admin.",
    pains: ["Reps lose hours to manual dialing", "CRM activity is never up to date", "Low connect rates on cold lists"],
    featureSlugs: ["power-dialer", "parallel-dialer", "conversation-intelligence", "ai-coaching"],
    kpis: [
      { value: "3x", label: "talk time per rep" },
      { value: "100%", label: "calls logged to CRM" },
      { value: "+27%", label: "meetings booked" },
    ],
  },
  {
    slug: "support",
    name: "Customer support",
    icon: HeartHandshake,
    short: "Shorter queues, happier customers, fewer escalations.",
    headline: "Support that picks up on the first ring",
    intro: "Route every caller to the right agent with full context, and measure service levels in real time.",
    pains: ["Long hold times and abandoned calls", "Agents asking customers to repeat themselves", "No visibility into queue health"],
    featureSlugs: ["ivr", "smart-routing", "analytics", "ai-voice-agent"],
    kpis: [
      { value: "-42%", label: "average wait time" },
      { value: "+21%", label: "first-call resolution" },
      { value: "4.8/5", label: "CSAT after calls" },
    ],
  },
  {
    slug: "startups",
    name: "Startups & SMBs",
    icon: Rocket,
    short: "A professional phone system in minutes, priced per seat.",
    headline: "Sound like an enterprise from day one",
    intro: "Get numbers, an IVR and a shared team line without a telecom contract or an IT department.",
    pains: ["Personal mobiles used for business calls", "Missed calls when the founder is busy", "Telecom contracts that do not scale"],
    featureSlugs: ["cloud-call-center", "global-numbers", "sms-whatsapp", "ivr"],
    kpis: [
      { value: "5 min", label: "setup time" },
      { value: "0", label: "hardware required" },
      { value: "-50%", label: "vs. legacy phone bills" },
    ],
  },
  {
    slug: "ecommerce",
    name: "E-commerce",
    icon: ShoppingBag,
    short: "Order context on every call and text-back for missed ones.",
    headline: "Turn order questions into repeat purchases",
    intro: "See the caller's last orders before you say hello, and never let a missed call become a lost sale.",
    pains: ["Peak-season call spikes", "Agents switching between tabs to find orders", "Missed calls during off-hours"],
    featureSlugs: ["smart-routing", "sms-whatsapp", "ai-voice-agent", "analytics"],
    kpis: [
      { value: "-30%", label: "handle time" },
      { value: "24/7", label: "order status answers" },
      { value: "+12%", label: "repeat purchase rate" },
    ],
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    icon: Building2,
    short: "SSO, granular permissions, data residency and a 99.99% SLA.",
    headline: "Built for scale, security and control",
    intro: "Roll DevyTalk out to thousands of agents across regions with the controls your security team expects.",
    pains: ["Complex multi-site telephony", "Strict compliance and data residency", "Disconnected tools per region"],
    featureSlugs: ["cloud-call-center", "call-recording", "analytics", "ai-coaching"],
    kpis: [
      { value: "99.99%", label: "uptime SLA" },
      { value: "SSO", label: "SAML & SCIM" },
      { value: "EU/US", label: "data residency" },
    ],
  },
  {
    slug: "healthcare",
    name: "Healthcare & clinics",
    icon: Stethoscope,
    short: "Appointment lines that never ring out, with secure recordings.",
    headline: "Patients reach a person, not a busy tone",
    intro: "Handle appointment peaks with queues, callbacks and an AI agent that books slots outside opening hours.",
    pains: ["Morning call peaks", "Sensitive data in recordings", "Missed calls mean missed appointments"],
    featureSlugs: ["ai-voice-agent", "call-recording", "ivr", "sms-whatsapp"],
    kpis: [
      { value: "-60%", label: "abandoned calls" },
      { value: "24/7", label: "appointment booking" },
      { value: "-25%", label: "no-shows with SMS reminders" },
    ],
  },
];

export function getSolution(slug: string) {
  return solutions.find((s) => s.slug === slug);
}
