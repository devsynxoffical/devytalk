import { BookOpenText, Building, Globe2, Newspaper, type LucideIcon } from "lucide-react";
import { features, getFeature } from "./features";
import { solutions } from "./solutions";
import { posts } from "./blog";

export type NavLink = { label: string; href: string; description?: string; icon?: LucideIcon };
export type NavFeatured = { eyebrow: string; title: string; body: string; href: string; cta: string };
export type NavItem = {
  label: string;
  href?: string;
  columns?: { title: string; links: NavLink[] }[];
  featured?: NavFeatured;
  footer?: { label: string; href: string };
};

/** Short, one-line menu descriptions; the longer copy lives on each feature page. */
const menuBlurb: Record<string, string> = {
  "cloud-call-center": "Your contact center in a browser tab",
  "power-dialer": "Work through lists hands-free",
  "parallel-dialer": "Only connect to real humans",
  ivr: "Drag-and-drop phone menus",
  "smart-routing": "The right agent, first time",
  "global-numbers": "Local numbers in 140+ countries",
  "call-recording": "Record, search and share calls",
  analytics: "Live wallboards and reports",
  "conversation-intelligence": "Transcripts and AI summaries",
  "ai-voice-agent": "Answers and books meetings 24/7",
  "ai-coaching": "Scorecards after every call",
  "sms-whatsapp": "Texts in the same thread",
};

function featureLinks(slugs: string[]): NavLink[] {
  return slugs.map((slug) => {
    const f = getFeature(slug)!;
    return { label: f.name, href: `/features/${f.slug}`, description: menuBlurb[f.slug] ?? f.short, icon: f.icon };
  });
}

const solutionBlurb: Record<string, string> = {
  sales: "More conversations, less admin",
  support: "Shorter queues, happier customers",
  startups: "A pro phone line in minutes",
  ecommerce: "Order context on every call",
  enterprise: "SSO, SLAs and data residency",
  healthcare: "Appointment lines that never ring out",
};

const latestPost = posts[0];

export const mainNav: NavItem[] = [
  {
    label: "Product",
    columns: [
      { title: "Calling & routing", links: featureLinks(["cloud-call-center", "power-dialer", "parallel-dialer", "ivr", "smart-routing", "global-numbers"]) },
      { title: "Insights & AI", links: featureLinks(["call-recording", "analytics", "conversation-intelligence", "ai-voice-agent", "ai-coaching", "sms-whatsapp"]) },
    ],
    featured: {
      eyebrow: "New",
      title: "Meet Devy, the AI Voice Agent",
      body: "Answers, qualifies and books meetings in 30+ languages, around the clock.",
      href: "/features/ai-voice-agent",
      cta: "See how it works",
    },
    footer: { label: "Explore all features", href: "/features" },
  },
  {
    label: "Solutions",
    columns: [
      {
        title: "By team & industry",
        links: solutions.map((s) => ({ label: s.name, href: `/solutions/${s.slug}`, description: solutionBlurb[s.slug] ?? s.short, icon: s.icon })),
      },
    ],
    featured: {
      eyebrow: "Customer story",
      title: "Lumen Health cut abandoned calls by 60%",
      body: "How 12 clinics book appointments around the clock with an AI agent.",
      href: "/customers",
      cta: "Read the story",
    },
  },
  { label: "Integrations", href: "/integrations" },
  { label: "Pricing", href: "/pricing" },
  {
    label: "Resources",
    columns: [
      {
        title: "Learn",
        links: [
          { label: "Blog", href: "/blog", description: "Guides for phone teams", icon: BookOpenText },
          { label: "Customer stories", href: "/customers", description: "How teams use DevyTalk", icon: Newspaper },
          { label: "Phone numbers", href: "/numbers", description: "Coverage and prices", icon: Globe2 },
          { label: "About us", href: "/about", description: "Our mission and team", icon: Building },
        ],
      },
    ],
    featured: {
      eyebrow: latestPost.category,
      title: latestPost.title,
      body: `${latestPost.readMinutes} min read`,
      href: `/blog/${latestPost.slug}`,
      cta: "Read article",
    },
  },
];

export const footerNav: { title: string; links: NavLink[] }[] = [
  { title: "Product", links: [...features.slice(0, 6).map((f) => ({ label: f.name, href: `/features/${f.slug}` })), { label: "All features", href: "/features" }] },
  { title: "Solutions", links: solutions.map((s) => ({ label: s.name, href: `/solutions/${s.slug}` })) },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Customers", href: "/customers" },
      { label: "Blog", href: "/blog" },
      { label: "Contact sales", href: "/demo" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Integrations", href: "/integrations" },
      { label: "Phone numbers", href: "/numbers" },
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Terms of service", href: "/legal/terms" },
    ],
  },
];
