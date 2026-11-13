"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, CircleAlert, FileClock, FlaskConical, PauseCircle, Plus, type LucideIcon } from "lucide-react";
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
import { EmptyState, ErrorState, Loading, Pill, type Tone } from "@/components/dashboard/ui";
import { AreaChart } from "@/components/dashboard/AreaChart";
import { BarRow, Panel, Ring, SERIES, STATUS, StatTile } from "@/components/dashboard/viz";
import { cn } from "@/lib/cn";

type Detail = { campaign: Campaign; report: Report; versions: Version[]; experiments: Experiment[]; hot: Lead[] };
type Details = { loading: boolean; items: Detail[]; failed: string[] };

const campaignHref = (name: string, section = "") => `/dashboard/campaigns/${encodeURIComponent(name)}${section}`;
const STATUS_TONE: Record<string, Tone> = { running: "green", ready: "blue", paused: "amber", done: "gray", draft: "gray" };

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

type Attention = { key: string; kind: "critical" | "warning" | "info" | "good"; icon: LucideIcon; title: string; detail: string; href: string };

const ATTENTION_STYLE: Record<Attention["kind"], string> = {
  critical: "bg-red-50 text-red-900 ring-red-100",
  warning: "bg-amber-50 text-amber-900 ring-amber-100",
  info: "bg-sky-50 text-sky-900 ring-sky-100",
  good: "bg-brand-50 text-brand-900 ring-brand-100",
};

function attentionItems(details: Detail[], deadJobs: number): Attention[] {
  const items: Attention[] = [];
  if (deadJobs > 0) {
    items.push({ key: "jobs", kind: "critical", icon: CircleAlert, title: `${count(deadJobs)} background ${deadJobs === 1 ? "job" : "jobs"} gave up`, detail: "Open Background work to see why and run them again.", href: "/dashboard/system" });
  }
  for (const { campaign, report, versions, experiments } of details) {
    const n = report.unsupported_statements.length;
    if (n > 0) {
      items.push({ key: `u-${campaign.id}`, kind: "critical", icon: AlertTriangle, title: `${n} ${n === 1 ? "statement" : "statements"} the playbook does not support`, detail: campaign.name, href: campaignHref(campaign.name) });
    }
    if (campaign.stop_reason) {
      items.push({ key: `p-${campaign.id}`, kind: "warning", icon: PauseCircle, title: `${campaign.name} paused itself`, detail: campaign.stop_reason, href: campaignHref(campaign.name) });
    }
    for (const version of versions.filter((v) => v.status === "draft")) {
      const blocked = version.blocking_questions.length > 0;
      items.push({
        key: `v-${campaign.id}-${version.version}`,
        kind: "info",
        icon: FileClock,
        title: `Playbook version ${version.version} is waiting for your decision`,
        detail: blocked ? `${campaign.name} · has questions to answer before it can go live` : campaign.name,
        href: campaignHref(campaign.name, "/playbook"),
      });
    }
    for (const test of experiments.filter((e) => e.status === "running" && e.enough_data)) {
      items.push({
        key: `e-${test.id}`,
        kind: test.verdict === "variant_ahead" ? "good" : "info",
        icon: test.verdict === "variant_ahead" ? CheckCircle2 : FlaskConical,
        title: test.verdict === "variant_ahead" ? `A/B test “${test.name}”: the new version is ahead` : `A/B test “${test.name}” has enough data`,
        detail: `${campaign.name} · ${test.verdict === "variant_ahead" ? "you can make it live" : label(test.verdict)}`,
        href: campaignHref(campaign.name, "/experiments"),
      });
    }
  }
  return items;
}

function initials(lead: Lead): string {
  const letters = (lead.name || lead.company || "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase());
  return letters.join("") || "#";
}

function SystemCard() {
  const { data, error, loading } = useApi(backendUrl(["jobs"], { limit: 1 }), jobsSchema);
  return (
    <Panel title="Background work" hint="Reviews, booking notifications and training runs" action={<Link href="/dashboard/system" className="text-xs font-semibold text-brand-700 hover:underline">Open</Link>}>
      {loading && !data ? (
        <p className="text-sm text-ink-500">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-700" role="alert">{error.message}</p>
      ) : data ? (
        <>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ["Waiting", data.stats.queued, false],
              ["Running", data.stats.running, false],
              ["Gave up", data.stats.dead, data.stats.dead > 0],
            ].map(([name, value, bad]) => (
              <div key={String(name)} className={cn("rounded-xl p-3", bad ? "bg-red-50" : "bg-ink-50")}>
                <dd className={cn("text-xl font-semibold", bad ? "text-red-800" : "text-ink-900")}>{count(value as number)}</dd>
                <dt className="mt-0.5 text-xs text-ink-500">{name}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
            {data.stats.dead > 0 ? (
              <>
                <CircleAlert className="size-3.5 text-red-600" aria-hidden="true" /> Some work failed for good and needs a look.
              </>
            ) : data.stats.oldest_due_seconds > 120 ? (
              <>
                <AlertTriangle className="size-3.5 text-amber-600" aria-hidden="true" /> The oldest waiting job is {Math.round(data.stats.oldest_due_seconds / 60)} minutes late.
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5 text-brand-600" aria-hidden="true" /> Nothing is stuck.
              </>
            )}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/dashboard/system" className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-800 ring-1 ring-inset ring-brand-200 hover:bg-brand-100">
              View work
            </Link>
            <Link href="/dashboard/campaigns" className="inline-flex h-9 items-center justify-center rounded-lg bg-ink-100 text-sm font-semibold text-ink-800 ring-1 ring-inset ring-ink-200 hover:bg-ink-200">
              Campaigns
            </Link>
          </div>
        </>
      ) : null}
    </Panel>
  );
}

const MEASURES = { calls: "Calls placed", answered: "Calls answered", conversions: "Conversions" } as const;
type Measure = keyof typeof MEASURES;
const MEASURE_COLOR: Record<Measure, string> = { calls: SERIES.blue.mark, answered: SERIES.blue.mark, conversions: SERIES.aqua.mark };

function ActivityCard() {
  const { data, error, loading, reload } = useApi(backendUrl(["timeline"], { days: 14 }), timelineSchema);
  const [measure, setMeasure] = useState<Measure>("calls");
  const total = data?.days.reduce((sum, day) => sum + day[measure], 0) ?? 0;
  return (
    <Panel
      title="Call activity"
      hint={data ? `Last ${data.days.length} days · ${count(total)} ${MEASURES[measure].toLowerCase()}` : "Last 14 days"}
      action={
        <label>
          <span className="sr-only">Show</span>
          <select value={measure} onChange={(e) => setMeasure(e.target.value as Measure)} className="h-9 rounded-xl border border-ink-100 bg-ink-50 px-3 text-sm font-medium text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100">
            {Object.entries(MEASURES).map(([key, text]) => (
              <option key={key} value={key}>
                {text}
              </option>
            ))}
          </select>
        </label>
      }
    >
      {loading && !data ? (
        <div className="grid h-[250px] place-items-center text-sm text-ink-500">Loading…</div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data ? (
        <>
          <AreaChart points={data.days.map((day) => ({ date: day.date, value: day[measure] }))} measure={MEASURES[measure]} color={MEASURE_COLOR[measure]} />
          {total === 0 && <p className="mt-1 text-center text-xs text-ink-500">No {MEASURES[measure].toLowerCase()} in this period.</p>}
        </>
      ) : null}
    </Panel>
  );
}

export default function OverviewPage() {
  const campaigns = useApi(backendUrl(["campaigns"]), campaignListSchema);
  const details = useDetails(campaigns.data);
  const jobs = useApi(backendUrl(["jobs"], { limit: 1 }), jobsSchema);

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-500">Here is how your calling campaigns are doing today.</p>
      </div>
      <Link href="/dashboard/campaigns" className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ink-800">
        All campaigns <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );

  if (campaigns.loading && !campaigns.data) return <>{header}<div className="mt-8"><Loading what="Loading overview" /></div></>;
  if (campaigns.error) return <>{header}<div className="mt-8"><ErrorState message={campaigns.error.message} onRetry={campaigns.reload} /></div></>;
  if (!campaigns.data) return header;
  if (campaigns.data.length === 0) {
    return (
      <>
        {header}
        <div className="mt-8">
          <EmptyState title="No campaigns yet">
            Create one on the calling engine with <code>callagent onboard</code>. It will appear here as soon as it exists.
          </EmptyState>
        </div>
      </>
    );
  }
  if (details.loading && details.items.length === 0) return <>{header}<div className="mt-8"><Loading what="Loading campaign results" /></div></>;

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
  const leads = sum((d) => d.report.leads.total);
  const hot = sum((d) => d.report.leads.hot);
  const scored = leads - sum((d) => d.report.leads.unscored);

  const ranked = items
    .map((d) => ({ d, rate: d.report.calls.conversion_rate }))
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));

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

  return (
    <>
      {header}

      {details.failed.length > 0 && (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Results for {details.failed.join(", ")} could not be loaded, so the totals below leave {details.failed.length === 1 ? "it" : "them"} out.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] [&>*]:min-w-0">
        <div className="min-w-0 space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 [&>*]:min-w-0">
            <StatTile
              testId="tile-calls"
              label="Calls answered"
              value={count(answered)}
              total={count(calls)}
              note={calls === 0 ? "No calls placed yet" : `across ${count(items.length)} ${items.length === 1 ? "campaign" : "campaigns"}`}
              ring={<Ring share={calls > 0 ? answered / calls : null} tint={SERIES.blue} label="Share of calls answered" />}
            />
            <StatTile
              testId="tile-conversions"
              label="Conversions"
              value={count(conversions)}
              total={count(answered)}
              note="Meetings booked and sales, of answered calls"
              ring={<Ring share={answered > 0 ? conversions / answered : null} tint={SERIES.aqua} label="Conversion rate" />}
            />
            {budgetShare ? (
              <StatTile
                testId="tile-spend"
                label="Budget used"
                value={money(budgetSpend)}
                note={`of ${money(budget)} budgeted${budgeted.length === items.length ? "" : ` · ${money(spend - budgetSpend)} unbudgeted`}`}
                ring={<Ring share={budgetShare.share} tint={budgetTint} label="Budget used" />}
              />
            ) : (
              <StatTile testId="tile-spend" label="Spend" value={money(spend)} note="No budget is set on any campaign" />
            )}
          </div>

          <ActivityCard />

          <Panel title="Call outcomes" hint="How every call ended, across all campaigns" action={<span className="text-xs text-ink-500">{count(calls)} calls</span>}>
            {shown.length === 0 ? (
              <p className="text-sm text-ink-500">No calls have ended yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-3.5 md:grid-cols-2 [&>*]:min-w-0" data-testid="outcomes">
                {shown.map(([name, n]) => (
                  <BarRow key={name} name={label(name)} share={n / topOutcome} figure={count(n)} detail={calls > 0 ? `${percent(n / calls, 0)} of calls` : undefined} />
                ))}
              </div>
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 [&>*]:min-w-0">
            <Panel title="Hot leads" hint={scored > 0 ? `${count(hot)} of ${count(scored)} scored leads are hot` : "Scored from what prospects said"} action={<Link href="/dashboard/campaigns" className="text-xs font-semibold text-ink-600 hover:text-ink-900">View all →</Link>}>
              {hotLeads.length === 0 ? (
                <p className="text-sm text-ink-500">No lead is hot yet. Scores appear once calls give evidence of need, authority and timing.</p>
              ) : (
                <ul className="-mx-2" data-testid="hot-leads">
                  {hotLeads.map(({ lead, campaign }) => (
                    <li key={`${campaign}-${lead.id}`}>
                      <Link href={campaignHref(campaign, "/leads")} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-ink-50">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-100 text-xs font-bold text-ink-700" aria-hidden="true">
                          {initials(lead)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink-900">{lead.name || lead.phone}</span>
                          <span className="block truncate text-xs text-ink-500">{lead.next_action ?? lead.company ?? campaign}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-sm font-semibold tabular-nums text-ink-900">{lead.score}</span>
                          <span className="block max-w-28 truncate text-[11px] text-ink-400">{campaign}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Needs your attention" hint="Decisions and problems, most serious first">
              {attention.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-ink-600">
                  <CheckCircle2 className="size-4 text-brand-600" aria-hidden="true" /> Nothing is waiting for you.
                </p>
              ) : (
                <ul className="space-y-2" data-testid="attention">
                  {attention.map((item) => (
                    <li key={item.key}>
                      <Link href={item.href} className={cn("flex items-center gap-3 rounded-xl px-3.5 py-3 ring-1 ring-inset transition-shadow hover:shadow-sm", ATTENTION_STYLE[item.kind])}>
                        <item.icon className="size-[18px] shrink-0" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{item.title}</span>
                          <span className="block truncate text-xs opacity-80">{item.detail}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 opacity-60" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>

        <div className="space-y-5">
          <Panel title="Top campaigns" hint="Conversion rate of answered calls">
            <ul className="space-y-1" data-testid="campaign-ranking">
              {ranked.map(({ d, rate }) => (
                <li key={d.campaign.id}>
                  <Link href={campaignHref(d.campaign.name)} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-ink-50">
                    <Ring share={rate} tint={rate === null ? STATUS.none : SERIES.aqua} label={`${d.campaign.name} conversion rate`} size={44} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-900">{d.campaign.name}</span>
                      <span className="block truncate text-xs text-ink-500">
                        {rate === null ? "No answered calls" : `${percent(rate)} · ${count(d.report.calls.conversions)} of ${count(d.report.calls.answered)} answered${d.report.calls.answered < 30 ? " · few calls" : ""}`}
                      </span>
                    </span>
                    <Pill tone={STATUS_TONE[d.campaign.status] ?? "gray"}>{d.campaign.running ? "Dialing" : label(d.campaign.status)}</Pill>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/dashboard/campaigns" className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-ink-600 hover:text-ink-900">
              See all campaigns <ChevronRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Panel>

          <SystemCard />

          <div className="rounded-2xl border border-dashed border-ink-200 bg-white/60 p-5 text-sm text-ink-600">
            <p className="flex items-center gap-2 font-semibold text-ink-800">
              <Plus className="size-4" aria-hidden="true" /> New campaign
            </p>
            <p className="mt-1">
              Campaigns are created on the calling engine with <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">callagent onboard</code> and show up here.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
