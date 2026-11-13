"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, PauseCircle } from "lucide-react";
import { backendUrl, useApi } from "@/lib/api/client";
import { budgetUse, count, languageName, money } from "@/lib/api/format";
import { campaignListSchema, type Campaign } from "@/lib/api/schemas";
import { EmptyState, ErrorState, Loading, Meter, Pill, type Tone } from "@/components/dashboard/ui";

const STATUS_TONE: Record<string, Tone> = { running: "green", ready: "blue", paused: "amber", done: "gray", draft: "gray" };

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const budget = budgetUse(campaign.spend_usd, campaign.budget_usd);
  const leads = campaign.stats.total ?? 0;
  return (
    <Link
      href={`/dashboard/campaigns/${encodeURIComponent(campaign.name)}`}
      className="group flex flex-col rounded-2xl border border-ink-100 bg-white p-5 transition-shadow hover:shadow-lg hover:shadow-ink-900/5"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink-900">{campaign.name}</h2>
        <Pill tone={STATUS_TONE[campaign.status] ?? "gray"}>{campaign.running ? "Dialing" : campaign.status}</Pill>
      </div>
      <p className="mt-1 text-sm text-ink-500">
        {count(leads)} {leads === 1 ? "lead" : "leads"} · {campaign.languages.map(languageName).join(", ") || "No language set"}
      </p>
      {campaign.stop_reason && (
        <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-2.5 text-sm text-amber-800">
          <PauseCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> Paused automatically: {campaign.stop_reason}
        </p>
      )}
      <div className="mt-4 flex-1">
        {budget ? (
          <>
            <div className="mb-1.5 flex justify-between text-xs text-ink-500">
              <span>
                {money(campaign.spend_usd)} of {money(campaign.budget_usd)} spent
              </span>
              <span>{money(budget.remaining)} left</span>
            </div>
            <Meter share={budget.share} tone={budget.share >= 1 ? "red" : budget.share >= 0.8 ? "amber" : "green"} label="Budget used" />
          </>
        ) : (
          <p className="text-xs text-ink-500">{campaign.spend_usd > 0 ? `${money(campaign.spend_usd)} spent · no budget set` : "No budget set"}</p>
        )}
      </div>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
        Open campaign <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

function CampaignList() {
  const query = (useSearchParams().get("q") ?? "").trim();
  const { data, error, loading, reload } = useApi(backendUrl(["campaigns"]), campaignListSchema);
  const shown = data?.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())) ?? [];
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Campaigns</h1>
      <p className="mt-1 text-sm text-ink-500">Open a campaign to see how its calls are going, who to follow up with, and what to improve.</p>
      {query && (
        <p className="mt-4 text-sm text-ink-600">
          Showing campaigns matching “{query}”.{" "}
          <Link href="/dashboard/campaigns" className="font-semibold text-brand-700 hover:underline">
            Show all
          </Link>
        </p>
      )}
      <div className="mt-6">
        {loading && !data ? (
          <Loading what="Loading campaigns" />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : data && data.length === 0 ? (
          <EmptyState title="No campaigns yet">
            Create one on the calling engine with <code>callagent onboard</code>. It will appear here as soon as it exists.
          </EmptyState>
        ) : shown.length === 0 ? (
          <EmptyState title="No campaign matches your search">Check the spelling, or show all campaigns.</EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{shown.map((c) => <CampaignCard key={c.id} campaign={c} />)}</div>
        )}
      </div>
    </>
  );
}

export default function CampaignsPage() {
  // useSearchParams needs a Suspense boundary so the rest of the page can render first.
  return (
    <Suspense fallback={<Loading what="Loading campaigns" />}>
      <CampaignList />
    </Suspense>
  );
}
