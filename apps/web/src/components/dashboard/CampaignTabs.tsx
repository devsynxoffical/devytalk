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
    <nav aria-label="Campaign sections" className="mt-5 flex gap-1 overflow-x-auto border-b border-ink-200">
      {TABS.map((tab) => {
        const href = base + tab.segment;
        const active = decodeURIComponent(pathname) === decodeURIComponent(href);
        return (
          <Link
            key={tab.label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
              active ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-900",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
