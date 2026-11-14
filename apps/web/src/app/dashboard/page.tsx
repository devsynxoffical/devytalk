"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { budgetUse, count, label, money, percent } from "@/lib/api/format";
import {
  campaignListSchema,
  experimentListSchema,
  jobsSchema,
  leadListSchema,
  reportSchema,
  timelineSchema,
  versionListSchema,
  type Campaign,
  type Experiment,
  type Lead,
  type Report,
  type Version,
} from "@/lib/api/schemas";
import { AreaChart } from "@/components/dashboard/AreaChart";
import { campaignTone } from "@/components/dashboard/Shell";
import { Banner, DataTable, EmptyState, ErrorState, Loading, Meter, Metric, MetricStrip, PageHeader, Panel, Segmented, Skeleton, Status, buttonClass, type Column, type Tone } from "@/components/dashboard/ui";
import { BarRow, Ring, SERIES, STATUS } from "@/components/dashboard/viz";

type Detail = { campaign: Campaign; report: Report; versions: Version[]; experiments: Experiment[]; hot: Lead[] };
type Details = { loading: boolean; items: Detail[]; failed: string[] };

const campaignHref = (name: string, section = "") => `/dashboard/campaigns/${encodeURIComponent(name)}${section}`;
const TONE_MARK: Record<Tone, string> = { crit: "bg-crit", warn: "bg-warn", info: "bg-info", pos: "bg-pos", neutral: "bg-fg-3" };

/** Everything the overview shows about each campaign, loaded side by side. A campaign that fails to load is named, not hidden. */
function useDetails(campaigns: Campaign[] | null): Details {
  const [state, setState] = useState<Details>({ loading: true, items: [], failed: [] });
  useEffect(() => {
    if (!campaigns) return;
    const controller = new AbortController();
    const signal = controller.signal;
    setState((previous) => ({ ...previous, loading: true }));
    Promise.allSettled(
      campaigns.map(async (campaign): Promise<Detail> => {
        const base = ["campaigns", campaign.name];
        const [report, versions, experiments, hot] = await Promise.all([
          apiRequest(backendUrl([...base, "report"]), reportSchema, { signal }),
          apiRequest(backendUrl([...base, "versions"]), versionListSchema, { signal }),
          apiRequest(backendUrl([...base, "experiments"]), experimentListSchema, { signal }),
          apiRequest(backendUrl([...base, "leads"], { category: "hot", limit: 5 }), leadListSchema, { signal }),
        ]);
        return { campaign, report, versions, experiments, hot: hot.leads };
      }),
    ).then((results) => {
      if (signal.aborted) return;
      const items: Detail[] = [];
      const failed: string[] = [];
      results.forEach((result, i) => (result.status === "fulfilled" ? items.push(result.value) : failed.push(campaigns[i].name)));
      setState({ loading: false, items, failed });
    });
    return () => controller.abort();
  }, [campaigns]);
  return state;
}

type Attention = { key: string; tone: Tone; title: string; detail: string; href: string };

function attentionItems(details: Detail[], deadJobs: number): Attention[] {
  const items: Attention[] = [];
  if (deadJobs > 0) {
    items.push({ key: "jobs", tone: "crit", title: `${count(deadJobs)} background ${deadJobs === 1 ? "job" : "jobs"} gave up`, detail: "See why and run them again", href: "/dashboard/system" });
  }
  for (const { campaign, report, versions, experiments } of details) {
    const n = report.unsupported_statements.length;
    if (n > 0) items.push({ key: `u-${campaign.id}`, tone: "crit", title: `${n} ${n === 1 ? "statement" : "statements"} the playbook does not support`, detail: campaign.name, href: campaignHref(campaign.name) });
    if (campaign.stop_reason) items.push({ key: `p-${campaign.id}`, tone: "warn", title: `${campaign.name} paused itself`, detail: campaign.stop_reason, href: campaignHref(campaign.name) });
    for (const version of versions.filter((v) => v.status === "draft")) {
      items.push({
        key: `v-${campaign.id}-${version.version}`,
        tone: "info",
        title: `Playbook version ${version.version} is waiting for your decision`,
        detail: version.blocking_questions.length > 0 ? `${campaign.name} · has questions to answer first` : campaign.name,
        href: campaignHref(campaign.name, "/playbook"),
      });
    }
    for (const test of experiments.filter((e) => e.status === "running" && e.enough_data)) {
      const ahead = test.verdict === "variant_ahead";
      items.push({
        key: `e-${test.id}`,
        tone: ahead ? "pos" : "info",
        title: ahead ? `A/B test “${test.name}”: the new version is ahead` : `A/B test “${test.name}” has enough data`,
        detail: `${campaign.name} · ${ahead ? "you can make it live" : label(test.verdict)}`,
        href: campaignHref(campaign.name, "/experiments"),
      });
    }
  }
  return items;
}

const MEASURES = { calls: "Calls placed", answered: "Calls answered", conversions: "Conversions" } as const;
type Measure = keyof typeof MEASURES;

function Activity() {
  const { data, error, loading, reload } = useApi(backendUrl(["timeline"], { days: 14 }), timelineSchema);
  const [measure, setMeasure] = useState<Measure>("calls");
  const total = data?.days.reduce((sum, day) => sum + day[measure], 0) ?? 0;
  return (
    <Panel
      title="Call activity"
      description={data ? `Last ${data.days.length} days · ${count(total)} ${MEASURES[measure].toLowerCase()}` : "Last 14 days"}
      actions={<Segmented label="Show" value={measure} onChange={setMeasure} options={[["calls", "Placed"], ["answered", "Answered"], ["conversions", "Conversions"]]} />}
    >
      {loading && !data ? (
        <Skeleton className="h-[250px] w-full" />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data ? (
        <>
          <AreaChart points={data.days.map((day) => ({ date: day.date, value: day[measure] }))} measure={MEASURES[measure]} color={measure === "conversions" ? SERIES.green.mark : SERIES.blue.mark} />
          {total === 0 && <p className="t-meta mt-1 text-center">No {MEASURES[measure].toLowerCase()} in this period.</p>}
        </>
      ) : null}
    </Panel>
  );
}

function BackgroundWork() {
  const { data, error } = useApi(backendUrl(["jobs"], { limit: 1 }), jobsSchema);
  return (
    <Panel title="Background work" description="Reviews, booking notifications, training" actions={<Link href="/dashboard/system" className="text-[12.5px] font-medium text-accent hover:underline">Open</Link>} flush>
      {error ? (
        <p className="px-4 py-3 text-[13px] text-crit" role="alert">{error.message}</p>
      ) : (
        <dl className="grid grid-cols-3 divide-x divide-line">
          {(["queued", "running", "dead"] as const).map((key) => (
            <div key={key} className="px-4 py-3">
              <dt className="t-eyebrow">{{ queued: "Waiting", running: "Running", dead: "Gave up" }[key]}</dt>
              <dd className={`t-figure mt-1 text-[18px] font-medium ${key === "dead" && (data?.stats.dead ?? 0) > 0 ? "text-crit" : "text-fg"}`}>{data ? count(data.stats[key]) : "–"}</dd>
            </div>
          ))}
        </dl>
      )}
    </Panel>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const campaigns = useApi(backendUrl(["campaigns"]), campaignListSchema);
  const details = useDetails(campaigns.data);
  const jobs = useApi(backendUrl(["jobs"], { limit: 1 }), jobsSchema);

  const header = (
    <PageHeader
      title="Overview"
      description="Where your calling campaigns stand right now, and what is waiting for a decision."
      actions={
        <Link href="/dashboard/campaigns" className={buttonClass("primary")}>
          All campaigns <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      }
    />
  );
  const body = (node: React.ReactNode) => (
    <>
      {header}
      <div className="mt-5">{node}</div>
    </>
  );

  if (campaigns.loading && !campaigns.data) return body(<Loading what="Loading overview" />);
  if (campaigns.error) return body(<ErrorState message={campaigns.error.message} onRetry={campaigns.reload} />);
  if (!campaigns.data) return header;
  if (campaigns.data.length === 0) {
    return body(
      <EmptyState title="No campaigns yet">
        Create one on the calling engine with <code className="t-figure rounded-chip bg-sunken px-1">callagent onboard</code>. It appears here as soon as it exists.
      </EmptyState>,
    );
  }
  if (details.loading && details.items.length === 0) return body(<Loading what="Loading campaign results" />);

  const items = details.items;
  const sum = (pick: (d: Detail) => number) => items.reduce((total, d) => total + pick(d), 0);
  const calls = sum((d) => d.report.calls.total);
  const answered = sum((d) => d.report.calls.answered);
  const conversions = sum((d) => d.report.calls.conversions);
  const spend = sum((d) => d.campaign.spend_usd);
  const budgeted = items.filter((d) => d.campaign.budget_usd !== null);
  const budget = budgeted.reduce((total, d) => total + (d.campaign.budget_usd ?? 0), 0);
  const budgetSpend = budgeted.reduce((total, d) => total + d.campaign.spend_usd, 0);
  const budgetShare = budgetUse(budgetSpend, budgeted.length ? budget : null);
  const hot = sum((d) => d.report.leads.hot);
  const scored = sum((d) => d.report.leads.total - d.report.leads.unscored);

  const outcomes = new Map<string, number>();
  for (const d of items) for (const [name, n] of Object.entries(d.report.calls.dispositions)) outcomes.set(name, (outcomes.get(name) ?? 0) + n);
  const outcomeRows = [...outcomes.entries()].sort((a, b) => b[1] - a[1]);
  const shown = outcomeRows.slice(0, 6);
  const other = outcomeRows.slice(6).reduce((total, [, n]) => total + n, 0);
  if (other > 0) shown.push(["other outcomes", other]);
  const topOutcome = Math.max(1, ...shown.map(([, n]) => n));

  const hotLeads = items.flatMap((d) => d.hot.map((lead) => ({ lead, campaign: d.campaign.name }))).sort((a, b) => (b.lead.score ?? 0) - (a.lead.score ?? 0)).slice(0, 6);
  const attention = attentionItems(items, jobs.data?.stats.dead ?? 0);
  const budgetTint = !budgetShare ? STATUS.none : budgetShare.share >= 1 ? STATUS.critical : budgetShare.share >= 0.8 ? STATUS.warning : STATUS.good;

  const columns: Column<Detail>[] = [
    {
      key: "name",
      label: "Campaign",
      primary: true,
      sortValue: (d) => d.campaign.name,
      render: (d) => {
        const state = campaignTone(d.campaign);
        return (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <Link href={campaignHref(d.campaign.name)} onClick={(e) => e.stopPropagation()} className="font-medium text-fg hover:underline">
              {d.campaign.name}
            </Link>
            <Status tone={state.tone} live={state.live}>
              {state.text}
            </Status>
          </span>
        );
      },
    },
    { key: "calls", label: "Calls", numeric: true, sortValue: (d) => d.report.calls.total, render: (d) => count(d.report.calls.total) },
    { key: "answered", label: "Answered", numeric: true, sortValue: (d) => d.report.calls.answered, render: (d) => count(d.report.calls.answered) },
    { key: "conversions", label: "Conversions", numeric: true, sortValue: (d) => d.report.calls.conversions, render: (d) => count(d.report.calls.conversions) },
    {
      key: "rate",
      label: "Conversion rate",
      numeric: true,
      sortValue: (d) => d.report.calls.conversion_rate,
      render: (d) => (d.report.calls.conversion_rate === null ? <span className="font-sans text-fg-3">No answered calls</span> : percent(d.report.calls.conversion_rate)),
    },
    {
      key: "spend",
      label: "Spend",
      numeric: true,
      sortValue: (d) => d.campaign.spend_usd,
      render: (d) => {
        const use = budgetUse(d.campaign.spend_usd, d.campaign.budget_usd);
        return (
          <span className="inline-flex flex-col items-end gap-1">
            <span>
              {money(d.campaign.spend_usd)}
              {use && <span className="text-fg-3"> / {money(d.campaign.budget_usd)}</span>}
            </span>
            {use && (
              <span className="block w-24">
                <Meter share={use.share} tone={use.share >= 1 ? "crit" : use.share >= 0.8 ? "warn" : "pos"} label={`${d.campaign.name} budget used`} />
              </span>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <>
      {header}

      <div className="mt-5 space-y-5">
        {details.failed.length > 0 && (
          <Banner tone="warn" role="alert" title={`Results for ${details.failed.join(", ")} could not be loaded`}>
            The totals below leave {details.failed.length === 1 ? "it" : "them"} out.
          </Banner>
        )}

        <MetricStrip>
          <Metric
            testId="tile-calls"
            label="Calls answered"
            value={count(answered)}
            total={count(calls)}
            note={calls === 0 ? "No calls placed yet" : `across ${count(items.length)} ${items.length === 1 ? "campaign" : "campaigns"}`}
            aside={<Ring share={calls > 0 ? answered / calls : null} tint={SERIES.blue} label="Share of calls answered" />}
          />
          <Metric
            testId="tile-conversions"
            label="Conversions"
            value={count(conversions)}
            total={count(answered)}
            note="Meetings booked and sales"
            aside={<Ring share={answered > 0 ? conversions / answered : null} tint={SERIES.green} label="Conversion rate" />}
          />
          <Metric testId="tile-hot" label="Hot leads" value={count(hot)} total={count(scored)} note={scored === 0 ? "No lead scored yet" : "of leads with call evidence"} />
          {budgetShare ? (
            <Metric
              testId="tile-spend"
              label="Budget used"
              value={money(budgetSpend)}
              note={`of ${money(budget)} budgeted${budgeted.length === items.length ? "" : ` · ${money(spend - budgetSpend)} unbudgeted`}`}
              aside={<Ring share={budgetShare.share} tint={budgetTint} label="Budget used" />}
            />
          ) : (
            <Metric testId="tile-spend" label="Spend" value={money(spend)} note="No budget is set on any campaign" />
          )}
        </MetricStrip>

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] [&>*]:min-w-0">
          <div className="space-y-5">
            <Activity />
            <BackgroundWork />
          </div>
          <div className="space-y-5">
            <Panel title="Needs your attention" description="Most serious first" flush>
              {attention.length === 0 ? (
                <p className="px-4 py-4 text-[13px] text-fg-2">Nothing is waiting for you.</p>
              ) : (
                <ul className="divide-y divide-line" data-testid="attention">
                  {attention.map((item) => (
                    <li key={item.key}>
                      <Link href={item.href} className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-paper">
                        <span className={`mt-1.5 size-1.5 shrink-0 self-start rounded-[1px] ${TONE_MARK[item.tone]}`} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-[13px] font-medium text-fg">{item.title}</span>
                          <span className="t-meta mt-0.5 line-clamp-2">{item.detail}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-fg-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>

        <Panel title="Campaigns" description="Select a column heading to sort" flush>
          <DataTable columns={columns} rows={items} rowKey={(d) => d.campaign.id} caption="Campaigns compared" initialSort={{ key: "rate", descending: true }} onRowClick={(d) => router.push(campaignHref(d.campaign.name))}
            testId="campaign-ranking"
            mobileRow={(d) => {
              const state = campaignTone(d.campaign);
              return (
                <span className="flex items-center justify-between gap-4">
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-fg">{d.campaign.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3">
                      <Status tone={state.tone} live={state.live}>{state.text}</Status>
                      <span className="t-meta">{count(d.report.calls.conversions)} of {count(d.report.calls.answered)} answered</span>
                    </span>
                  </span>
                  <span className="t-figure shrink-0 text-[15px] font-medium text-fg">{d.report.calls.conversion_rate === null ? "–" : percent(d.report.calls.conversion_rate)}</span>
                </span>
              );
            }}
          />
        </Panel>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 [&>*]:min-w-0">
          <Panel title="Call outcomes" description={`How ${count(calls)} calls ended, across all campaigns`}>
            {shown.length === 0 ? (
              <p className="text-[13px] text-fg-2">No calls have ended yet.</p>
            ) : (
              <div className="space-y-3.5" data-testid="outcomes">
                {shown.map(([name, n]) => (
                  <BarRow key={name} name={label(name)} share={n / topOutcome} figure={count(n)} detail={calls > 0 ? `${percent(n / calls, 0)} of calls` : undefined} tint={name === "meeting_booked" || name === "sale_closed" ? SERIES.green : SERIES.blue} />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Hot leads" description={scored > 0 ? `${count(hot)} of ${count(scored)} scored leads are hot` : "Scored from what prospects said"} flush>
            {hotLeads.length === 0 ? (
              <p className="px-4 py-4 text-[13px] text-fg-2">No lead is hot yet. Scores appear once calls give evidence of need, authority and timing.</p>
            ) : (
              <ul className="divide-y divide-line" data-testid="hot-leads">
                {hotLeads.map(({ lead, campaign }) => (
                  <li key={`${campaign}-${lead.id}`}>
                    <Link href={campaignHref(campaign, "/leads")} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-paper">
                      <span className="t-figure w-8 shrink-0 text-right text-[15px] font-medium text-fg">{lead.score}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-fg">{lead.name || lead.phone}</span>
                        <span className="t-meta block truncate">{lead.next_action ?? lead.company ?? ""}</span>
                      </span>
                      <span className="t-meta max-w-32 shrink-0 truncate max-sm:hidden">{campaign}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
