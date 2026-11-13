import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CampaignTabs } from "@/components/dashboard/CampaignTabs";

export default async function CampaignLayout({ children, params }: { children: React.ReactNode; params: Promise<{ name: string }> }) {
  const name = decodeURIComponent((await params).name);
  return (
    <>
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900">
        <ChevronLeft className="size-4" aria-hidden="true" /> All campaigns
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">{name}</h1>
      <CampaignTabs name={name} />
      <div className="mt-6">{children}</div>
    </>
  );
}
