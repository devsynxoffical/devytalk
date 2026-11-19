import { Activity, Building, Building2, CircleHelp, Inbox, KeySquare, LayoutGrid, Megaphone, PhoneOff, PlugZap, Receipt, UsersRound, Webhook, type LucideIcon } from "lucide-react";
import type { Me } from "@/lib/api/schemas";

/**
 * Every place in the console, once. The rail, the phone's menu, the breadcrumb and the
 * search all read this list, so a page cannot be reachable from one and missing from another.
 */
export type Place = {
  href: string;
  label: string;
  /** One line on what the page is for, shown in search and on the phone's menu. */
  about: string;
  icon: LucideIcon;
  group: "main" | "account" | "developers" | "foot";
  /** Matches the address exactly; otherwise the page and everything under it. */
  exact?: boolean;
  /** Who sees it. Without it, everyone signed in. */
  only?: "admin" | "platform";
  /** Other words people search by. */
  keywords?: string;
};

export const PLACES: Place[] = [
  { href: "/dashboard", label: "Overview", about: "How every campaign is doing, and what needs you", icon: LayoutGrid, group: "main", exact: true, keywords: "home dashboard" },
  { href: "/dashboard/campaigns", label: "Campaigns", about: "Who the agent calls and what it says", icon: Megaphone, group: "main" },
  { href: "/dashboard/requests", label: "Requests", about: "Demo and call-back requests from your website", icon: Inbox, group: "main", keywords: "website forms inbox" },
  { href: "/dashboard/do-not-call", label: "Do not call", about: "Numbers the agent never calls", icon: PhoneOff, group: "main", keywords: "suppression opt out blocked dnc erase" },

  { href: "/dashboard/usage", label: "Usage", about: "What calls cost, month by month", icon: Receipt, group: "account", keywords: "billing statements cost spend invoice" },
  { href: "/dashboard/team", label: "Team", about: "Who can sign in, and what each person may do", icon: UsersRound, group: "account", only: "admin", keywords: "people users invite roles" },
  { href: "/dashboard/organization", label: "Organization", about: "Your numbers, call prices and how long calls are kept", icon: Building, group: "account", keywords: "settings company retention transfer" },
  { href: "/dashboard/organizations", label: "Organizations", about: "Every customer organization on this engine", icon: Building2, group: "account", only: "platform", keywords: "tenants customers" },

  { href: "/dashboard/keys", label: "API keys", about: "Let another program use this organization's data", icon: KeySquare, group: "developers", only: "admin", keywords: "token integration" },
  { href: "/dashboard/webhooks", label: "Webhooks", about: "Send events to an address of yours", icon: Webhook, group: "developers", only: "admin", keywords: "events integration crm" },
  { href: "/dashboard/system", label: "Background work", about: "Reviews, notifications and training the engine runs", icon: Activity, group: "developers", keywords: "jobs queue failed" },

  { href: "/dashboard/setup", label: "Setup", about: "Connect the phone, speech, AI and voice services", icon: PlugZap, group: "foot", keywords: "connections providers keys twilio deepgram elevenlabs anthropic" },
  { href: "/dashboard/help", label: "Help", about: "How it works, in plain words", icon: CircleHelp, group: "foot", keywords: "guide glossary questions support how" },
];

export const GROUP_TITLE: Record<Place["group"], string | null> = { main: null, account: "Account", developers: "Developers", foot: null };

export function canSee(place: Place, me: Me | null, isAdmin: boolean): boolean {
  if (place.only === "admin") return isAdmin;
  if (place.only === "platform") return Boolean(me?.platform);
  return true;
}

export const isAt = (place: Pick<Place, "href" | "exact">, pathname: string) => (place.exact ? pathname === place.href : pathname === place.href || pathname.startsWith(place.href + "/"));

/** The page this address belongs to, other than a campaign's own pages. */
export function placeAt(pathname: string): Place | undefined {
  return PLACES.filter((place) => isAt(place, pathname)).sort((a, b) => b.href.length - a.href.length)[0];
}
