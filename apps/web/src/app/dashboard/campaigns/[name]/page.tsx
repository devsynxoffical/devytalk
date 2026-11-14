"use client";

import { use } from "react";
import { backendUrl, useApi } from "@/lib/api/client";
import { DASH, budgetUse, count, label, languageName, money, percent } from "@/lib/api/format";
import { campaignSchema, reportSchema, rulesSchema, type Report, type Rules } from "@/lib/api/schemas";
import { GettingStarted } from "@/components/dashboard/CampaignSetup";
import { Banner, DataTable, EmptyState, ErrorState, KeyValues, Loading, Meter, Metric, MetricStrip, Panel, Tag, type Column } from "@/components/dashboard/ui";
import { BarRow, Ring, SERIES } from "@/components/dashboard/viz";

type Objection = Report["objections"][number];
type Group = Report["by_language"][string] & { key: string };

function Budget({ rules }: { rules: Rules }) {
  const budget = budgetUse(rules.spend_usd, rules.rules.budget_usd);
  return (
    <Panel title="Budget and limits" description="Spend is estimated from your configured cost per minute and per attempt">
      {budget ? (
        <>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="t-eyebrow">Spent</p>
              <p className="t-metric mt-1 text-fg" data-testid="budget-spent">{money(rules.spend_usd)}</p>
            </div>
            <div className="text-right">
              <p className="t-eyebrow">Left of {money(rules.rules.budget_usd)}</p>
              <p className="t-metric mt-1 text-fg" data-testid="budget-remaining">{money(budget.remaining)}</p>
            </div>
          </div>
          <div className="mt-3">
            <Meter share={budget.share} tone={budget.share >= 1 ? "crit" : budget.share >= 0.8 ? "warn" : "pos"} label="Budget used" />
            <p className="t-meta mt-1.5">{percent(budget.share, 0)} of the budget used</p>
          </div>
        </>
      ) : (
        <p className="text-[13px] text-fg-2">
          <span className="t-figure font-medium text-fg">{money(rules.spend_usd)}</span> spent so far. No budget is set for this campaign, so it will not stop on spend.
        </p>
      )}
      <KeyValues
        className="mt-4 border-t border-line"
        rows={[
          ["Calling days", rules.rules.calling_days.map(label).join(", ")],
          ["Calling hours", <span key="h" className="t-figure">{rules.rules.window_start}–{rules.rules.window_end}</span>],
          ["Attempts per lead", <span key="a" className="t-figure">{rules.rules.max_attempts}</span>],
          ["Daily call limit", rules.rules.max_calls_per_day === null ? "None" : <span key="d" className="t-figure">{count(rules.rules.max_calls_per_day)}</span>],
        ]}
      />
    </Panel>
  );
}

function Breakdown({ title, description, rows, empty }: { title: string; description?: string; rows: [string, number][]; empty: string }) {
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <Panel title={title} description={description}>
      {rows.length === 0 ? (
        <p className="text-[13px] text-fg-2">{empty}</p>
      ) : (
        <div className="space-y-3">
          {rows.map(([name, n]) => (
            <BarRow key={name} name={name} share={n / max} figure={count(n)} />
          ))}
        </div>
      )}
    </Panel>
  );
}

type Week = Report["quality_by_week"][number];

/** Each playbook version week by week: whether quality and results moved when the playbook did. */
function Weeks({ weeks }: { weeks: Week[] }) {
  const columns: Column<Week>[] = [
    { key: "week", label: "Week of", primary: true, sortValue: (w) => w.week, render: (w) => <span className="t-figure font-medium text-fg">{w.week}</span> },
    { key: "version", label: "Playbook", sortValue: (w) => w.playbook_version, render: (w) => (w.playbook_version === "unknown" ? "Not tracked" : `Version ${w.playbook_version}`) },
    { key: "answered", label: "Answered", numeric: true, sortValue: (w) => w.answered, render: (w) => count(w.answered) },
    { key: "rate", label: "Conversion rate", numeric: true, sortValue: (w) => w.conversion_rate, render: (w) => percent(w.conversion_rate) },
    { key: "quality", label: "Agent quality", numeric: true, sortValue: (w) => w.average_quality, render: (w) => (w.average_quality === null ? DASH : `${w.average_quality.toFixed(1)} / 10`) },
    { key: "cost", label: "Cost per conversion", numeric: true, sortValue: (w) => w.cost_per_conversion, render: (w) => money(w.cost_per_conversion) },
    { key: "sample", label: "Sample", render: (w) => (w.enough_data ? <Tag tone="pos">Enough to read</Tag> : <Tag tone="warn">Too few calls</Tag>) },
  ];
  return (
    <Panel title="Week by week" description="Each playbook version in the weeks it took calls. A week with fewer than 10 answered calls is shown and marked: it says little." flush>
      <DataTable columns={columns} rows={weeks} rowKey={(w) => `${w.week}-${w.playbook_version}`} caption="Results per playbook version by week" testId="weeks" initialSort={{ key: "week", descending: true }} />
    </Panel>
  );
}

function Groups({ title, description, groups, nameOf, best }: { title: string; description: string; groups: Report["by_language"]; nameOf: (key: string) => string; best?: string | null }) {
  const rows: Group[] = Object.entries(groups).map(([key, g]) => ({ ...g, key }));
  const columns: Column<Group>[] = [
    {
      key: "name",
      label: title.replace("By ", ""),
      primary: true,
      render: (g) => (
        <span className="flex flex-wrap items-center gap-2 font-medium text-fg">
          {nameOf(g.key)}
          {best === g.key && <Tag tone="pos">Best so far</Tag>}
        </span>
      ),
    },
    { key: "calls", label: "Calls", numeric: true, sortValue: (g) => g.calls, render: (g) => count(g.calls) },
    { key: "answered", label: "Answered", numeric: true, sortValue: (g) => g.answered, render: (g) => count(g.answered) },
    { key: "conversions", label: "Conversions", numeric: true, sortValue: (g) => g.conversions, render: (g) => count(g.conversions) },
    { key: "rate", label: "Conversion rate", numeric: true, sortValue: (g) => g.conversion_rate, render: (g) => percent(g.conversion_rate) },
    { key: "quality", label: "Agent quality", numeric: true, sortValue: (g) => g.average_quality, render: (g) => (g.average_quality === null ? DASH : `${g.average_quality.toFixed(1)} / 10`) },
    { key: "cost", label: "Cost per conversion", numeric: true, sortValue: (g) => g.cost_per_conversion, render: (g) => money(g.cost_per_conversion) },
    { key: "sample", label: "Sample", render: (g) => (g.enough_data ? <Tag tone="pos">Enough to compare</Tag> : <Tag tone="warn">Too few calls</Tag>) },
  ];
  return (
    <Panel title={title} description={description} flush>
      {rows.length === 0 ? <p className="px-4 py-4 text-[13px] text-fg-2">No calls yet.</p> : <DataTable columns={columns} rows={rows} rowKey={(g) => g.key} caption={title} />}
    </Panel>
  );
}

export default function PerformancePage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent(use(params).name);
  const report = useApi(backendUrl(["campaigns", name, "report"]), reportSchema);
  const rules = useApi(backendUrl(["campaigns", name, "rules"]), rulesSchema);
  const campaign = useApi(backendUrl(["campaigns", name]), campaignSchema);

  if ((report.loading && !report.data) || (rules.loading && !rules.data)) return <Loading what="Loading performance" />;
  if (report.error) return <ErrorState message={report.error.message} onRetry={report.reload} />;
  if (rules.error) return <ErrorState message={rules.error.message} onRetry={rules.reload} />;
  if (!report.data || !rules.data) return null;
  const r = report.data;
  const leadMax = Math.max(1, r.leads.hot, r.leads.warm, r.leads.cold, r.leads.unscored);

  const objections: Column<Objection>[] = [
    { key: "category", label: "Objection", primary: true, render: (o) => <span className="font-medium text-fg">{label(o.category)}</span> },
    { key: "raised", label: "Raised", numeric: true, sortValue: (o) => o.raised, render: (o) => count(o.raised) },
    {
      key: "handled",
      label: "Handled",
      numeric: true,
      sortValue: (o) => o.handled_rate,
      render: (o) => (
        <span className="inline-flex items-center gap-2">
          <span className="block w-16 max-sm:hidden">
            <Meter share={o.handled_rate ?? 0} tone={(o.handled_rate ?? 0) >= 0.6 ? "pos" : (o.handled_rate ?? 0) >= 0.3 ? "warn" : "crit"} label={`${label(o.category)} handled`} />
          </span>
          {percent(o.handled_rate, 0)}
        </span>
      ),
    },
    { key: "converted", label: "Still converted", numeric: true, sortValue: (o) => o.conversion_rate_when_raised, render: (o) => percent(o.conversion_rate_when_raised, 0) },
    { key: "quote", label: "In their words", render: (o) => (o.examples[0] ? <span className="text-fg-2">“{o.examples[0]}”</span> : null), className: "sm:max-w-72" },
  ];

  return (
    <div className="space-y-5">
      {rules.data.stop_reason && (
        <Banner tone="warn" role="status" testId="pause-reason" title="This campaign paused itself">
          Reason: {rules.data.stop_reason}.
        </Banner>
      )}

      {r.calls.total === 0 ? (
campaign.data ? <GettingStarted campaign={campaign.data} /> : <EmptyState title="No calls yet">Once this campaign places or receives calls, its results appear here.</EmptyState>
      ) : (
        <MetricStrip>
          <Metric label="Total calls" value={count(r.calls.total)} note={`${count(r.calls.reviewed)} reviewed`} />
          <Metric label="Answered" value={count(r.calls.answered)} total={count(r.calls.total)} aside={<Ring share={r.calls.answered / r.calls.total} tint={SERIES.blue} label="Share of calls answered" size={44} />} />
          <Metric label="Conversions" value={count(r.calls.conversions)} total={count(r.calls.answered)} aside={<Ring share={r.calls.conversion_rate} tint={SERIES.navy} label="Conversion rate" size={44} />} />
          <Metric label="Conversion rate" value={percent(r.calls.conversion_rate)} note="Of answered calls" />
          <Metric label="Cost per conversion" value={money(r.cost.cost_per_conversion)} note={`${money(r.cost.spend_usd)} spent`} wide />
        </MetricStrip>
      )}

      {r.unsupported_statements.length > 0 && (
        <Banner tone="crit" role="alert" title={`${r.unsupported_statements.length} ${r.unsupported_statements.length === 1 ? "statement" : "statements"} the playbook does not support`}>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {r.unsupported_statements.slice(0, 5).map((u, i) => (
              <li key={i}>
                {u.statement} <span className="text-fg-3">(call <span className="t-figure">{u.call_run_id}</span>)</span>
              </li>
            ))}
          </ul>
        </Banner>
      )}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <Panel title="Objections" description="Most frequent first. “Still converted” is how often a call with this objection ended in a meeting or sale." flush>
          {r.objections.length === 0 ? <p className="px-4 py-4 text-[13px] text-fg-2">No objections have been recorded in reviewed calls yet.</p> : <DataTable columns={objections} rows={r.objections} rowKey={(o) => o.category} caption="Objections" />}
        </Panel>
        <Budget rules={rules.data} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 [&>*]:min-w-0">
        <Panel title="Lead quality" description={`${count(r.leads.total)} leads. Unscored leads have no evidence yet.`}>
          <div className="space-y-3">
            {(["hot", "warm", "cold", "unscored"] as const).map((category) => (
              <BarRow key={category} name={label(category)} share={r.leads[category] / leadMax} figure={count(r.leads[category])} tint={category === "hot" ? SERIES.navy : SERIES.blue} muted={category === "unscored"} />
            ))}
          </div>
        </Panel>
        <Breakdown title="Why calls were lost" rows={Object.entries(r.lost_reasons).map(([k, n]) => [label(k), n])} empty="No lost reasons recorded yet." />
        <Breakdown title="Competitors mentioned" description="Names prospects said on calls" rows={Object.entries(r.competitors)} empty="No competitor has been named on a call yet." />
      </div>

      <Groups
        title="By playbook version"
        description="A best version is named only when at least two versions each have 30 answered calls."
        groups={r.by_playbook_version}
        nameOf={(key) => (key === "unknown" ? "Before versions were tracked" : `Version ${key}`)}
        best={r.best_version}
      />
      {r.quality_by_week.length > 1 && <Weeks weeks={r.quality_by_week} />}
      <Groups title="By language" description="The language the prospect mostly spoke." groups={r.by_language} nameOf={languageName} />
      {Object.keys(r.by_direction).length > 1 && <Groups title="Outbound and inbound" description="Calls the agent placed, and calls it answered on this campaign's number." groups={r.by_direction} nameOf={(key) => (key === "inbound" ? "Inbound" : "Outbound")} />}

      {r.missed_opportunities.length > 0 && (
        <Panel title="Missed opportunities" description="Buying signals or openings the agent did not act on, as noted by call reviews" flush>
          <ul className="divide-y divide-line">
            {r.missed_opportunities.map((m) => (
              <li key={m.text} className="flex justify-between gap-6 px-4 py-2.5 text-[13px]">
                <span className="text-fg">{m.text}</span>
                <span className="shrink-0 text-fg-3">
                  <span className="t-figure">{count(m.calls)}</span> {m.calls === 1 ? "call" : "calls"}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
