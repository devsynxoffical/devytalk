import { features } from "./features";
import { solutions } from "./solutions";

export type NavLink = { label: string; href: string; description?: string };
export type NavItem = { label: string; href?: string; columns?: { title: string; links: NavLink[] }[] };

export const mainNav: NavItem[] = [
  {
    label: "Product",
    columns: [
      {
        title: "Calling",
        links: features.filter((f) => f.group === "Calling").map((f) => ({ label: f.name, href: `/features/${f.slug}`, description: f.short })),
      },
      {
        title: "Routing & insights",
        links: features
          .filter((f) => f.group === "Routing" || f.group === "Insights")
          .map((f) => ({ label: f.name, href: `/features/${f.slug}`, description: f.short })),
      },
      {
        title: "AI",
        links: [
          ...features.filter((f) => f.group === "AI").map((f) => ({ label: f.name, href: `/features/${f.slug}`, description: f.short })),
          { label: "All features", href: "/features", description: "Browse the full platform." },
        ],
      },
    ],
  },
  {
    label: "Solutions",
    columns: [
      { title: "By team & industry", links: solutions.map((s) => ({ label: s.name, href: `/solutions/${s.slug}`, description: s.short })) },
    ],
  },
  { label: "Integrations", href: "/integrations" },
  { label: "Pricing", href: "/pricing" },
  {
    label: "Resources",
    columns: [
      {
        title: "Learn",
        links: [
          { label: "Blog", href: "/blog", description: "Guides for sales and support teams." },
          { label: "Customer stories", href: "/customers", description: "How teams use DevyTalk." },
          { label: "Phone numbers", href: "/numbers", description: "Coverage and prices by country." },
          { label: "About us", href: "/about", description: "Our mission and team." },
        ],
      },
    ],
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
