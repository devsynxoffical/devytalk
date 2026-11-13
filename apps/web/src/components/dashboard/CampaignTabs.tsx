"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { segment: "", label: "Performance" },
  { segment: "/leads", label: "Leads" },
  { segment: "/playbook", label: "Coach & playbook" },
  { segment: "/experiments", label: "A/B tests" },
];

export function CampaignTabs({ name }: { name: string }) {
  const pathname = usePathname();
  const base = `/dashboard/campaigns/${encodeURIComponent(name)}`;
  return (
    <nav aria-label="Campaign sections" className="mt-5 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-ink-100 p-1">
      {TABS.map((tab) => {
        const href = base + tab.segment;
        const active = decodeURIComponent(pathname) === decodeURIComponent(href);
        return (
          <Link
            key={tab.label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors",
              active ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
