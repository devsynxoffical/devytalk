"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Megaphone, Plus, Search } from "lucide-react";
import { backendUrl, useApi } from "@/lib/api/client";
import { budgetUse, count, languageName, money } from "@/lib/api/format";
import { campaignListSchema, type Campaign } from "@/lib/api/schemas";
import { useAccess } from "@/components/dashboard/access";
import { campaignTone } from "@/components/dashboard/Shell";
import { DataTable, EmptyState, ErrorState, Input, Loading, Meter, PageHeader, Panel, Segmented, Status, buttonClass, type Column } from "@/components/dashboard/ui";

type Filter = "all" | "active" | "attention";
const href = (name: string) => `/dashboard/campaigns/${encodeURIComponent(name)}`;

function CampaignGrid() {
  const router = useRouter();
  const initial = (useSearchParams().get("q") ?? "").trim();
  const [query, setQuery] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const { data, error, loading, reload } = useApi(backendUrl(["campaigns"]), campaignListSchema);
  const { isAdmin } = useAccess();

  const needle = query.trim().toLowerCase();
  const rows = (data ?? []).filter((c) => c.name.toLowerCase().includes(needle) && (filter === "all" || (filter === "active" ? c.running || c.status === "running" : Boolean(c.stop_reason))));

  const columns: Column<Campaign>[] = [
    {
      key: "name",
      label: "Campaign",
      primary: true,
      sortValue: (c) => c.name,
      render: (c) => (
        <span className="block">
          <Link href={href(c.name)} onClick={(e) => e.stopPropagation()} className="font-medium text-fg hover:underline">
            {c.name}
          </Link>
          <span className="t-meta block">{c.languages.map(languageName).join(", ") || "No language set"}</span>
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortValue: (c) => campaignTone(c).text,
      render: (c) => {
        const state = campaignTone(c);
        return (
          <span className="block">
            <Status tone={state.tone} live={state.live}>
              {state.text}
            </Status>
            {c.stop_reason && <span className="t-meta block max-w-64 max-sm:max-w-none">{c.stop_reason}</span>}
          </span>
        );
      },
    },
    { key: "leads", label: "Leads", numeric: true, sortValue: (c) => c.stats.total ?? 0, render: (c) => count(c.stats.total ?? 0) },
    { key: "pending", label: "Still to call", numeric: true, sortValue: (c) => (c.stats.pending ?? 0) + (c.stats.callback ?? 0), render: (c) => count((c.stats.pending ?? 0) + (c.stats.callback ?? 0)) },
    { key: "meetings", label: "Meetings", numeric: true, sortValue: (c) => c.stats["disposition:meeting_booked"] ?? 0, render: (c) => count(c.stats["disposition:meeting_booked"] ?? 0) },
    {
      key: "spend",
      label: "Spend",
      numeric: true,
      sortValue: (c) => c.spend_usd,
      render: (c) => {
        const use = budgetUse(c.spend_usd, c.budget_usd);
        return (
          <span className="inline-flex flex-col items-end gap-1">
            <span>
              {money(c.spend_usd)}
              {use ? <span className="text-fg-3"> / {money(c.budget_usd)}</span> : null}
            </span>
            {use ? (
              <span className="block w-24">
                <Meter share={use.share} tone={use.share >= 1 ? "crit" : use.share >= 0.8 ? "warn" : "pos"} label={`${c.name} budget used`} />
              </span>
            ) : (
              <span className="font-sans text-[11.5px] text-fg-3">no budget</span>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Campaigns"
        hint="campaign"
        description="Each campaign is one calling project. Open one to see its calls, leads and playbook."
        actions={
          isAdmin ? (
            <Link href="/dashboard/campaigns/new" className={buttonClass("primary")}>
              <Plus className="size-3.5" aria-hidden="true" />
              New campaign
            </Link>
          ) : undefined
        }
      />
      <div className="mt-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-3" aria-hidden="true" />
            <Input type="search" aria-label="Filter campaigns" placeholder="Filter by name" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
          </div>
          <Segmented label="Show" value={filter} onChange={setFilter} options={[["all", "All"], ["active", "Dialing"], ["attention", "Paused itself"]]} />
          {data && <p className="t-meta ml-auto" aria-live="polite">{count(rows.length)} of {count(data.length)}</p>}
        </div>

        {loading && !data ? (
          <Loading what="Loading campaigns" strip={false} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : data && data.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            icon={Megaphone}
            action={
              isAdmin ? (
                <>
                  <Link href="/dashboard/campaigns/new" className={buttonClass("primary")}>
                    <Plus className="size-3.5" aria-hidden="true" /> Create your first campaign
                  </Link>
                  <Link href="/dashboard/help#first-call" className={buttonClass("ghost")}>
                    See how it works
                  </Link>
                </>
              ) : undefined
            }
          >
            A campaign holds who the agent calls, what it says and the rules it follows.{isAdmin ? " You fill in one short form; the agent starts from exactly what you write." : " An admin creates the first one."}
          </EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState title="No campaign matches" icon={Search}>Change the name filter or show all campaigns.</EmptyState>
        ) : (
          <Panel flush>
            <DataTable columns={columns} rows={rows} rowKey={(c) => c.id} caption="Campaigns" onRowClick={(c) => router.push(href(c.name))}
              testId="campaign-grid"
              mobileRow={(c) => {
                const state = campaignTone(c);
                const use = budgetUse(c.spend_usd, c.budget_usd);
                return (
                  <span className="block">
                    <span className="flex items-baseline justify-between gap-4">
                      <span className="truncate text-[14px] font-medium text-fg">{c.name}</span>
                      <span className="t-figure shrink-0 text-[13px] text-fg">{money(c.spend_usd)}{use ? <span className="text-fg-3"> / {money(c.budget_usd)}</span> : null}</span>
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <Status tone={state.tone} live={state.live}>{state.text}</Status>
                      <span className="t-meta">{count(c.stats.total ?? 0)} leads · {count(c.stats["disposition:meeting_booked"] ?? 0)} meetings</span>
                    </span>
                    {c.stop_reason && <span className="t-meta mt-1 block">{c.stop_reason}</span>}
                  </span>
                );
              }}
            />
          </Panel>
        )}
      </div>
    </>
  );
}

export default function CampaignsPage() {
  // useSearchParams needs a Suspense boundary so the rest of the page can render first.
  return (
    <Suspense fallback={<Loading what="Loading campaigns" strip={false} />}>
      <CampaignGrid />
    </Suspense>
  );
}
