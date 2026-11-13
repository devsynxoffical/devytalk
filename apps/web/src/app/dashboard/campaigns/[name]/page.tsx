"use client";

import { use } from "react";
import { AlertTriangle, PauseCircle, Trophy } from "lucide-react";
import { backendUrl, useApi } from "@/lib/api/client";
import { budgetUse, count, label, languageName, money, percent } from "@/lib/api/format";
import { reportSchema, rulesSchema, type Report, type Rules } from "@/lib/api/schemas";
import { Card, CardTitle, EmptyState, ErrorState, Loading, Meter, Pill, Stat, TableWrap, Td, Th } from "@/components/dashboard/ui";

function BudgetCard({ rules }: { rules: Rules }) {
  const budget = budgetUse(rules.spend_usd, rules.rules.budget_usd);
  return (
    <Card>
      <CardTitle hint="Estimated from your configured cost per minute and per attempt.">Budget</CardTitle>
      {budget ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-ink-500">Spent</p>
              <p className="text-2xl font-semibold tabular-nums" data-testid="budget-spent">{money(rules.spend_usd)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-ink-500">Remaining of {money(rules.rules.budget_usd)}</p>
              <p className="text-2xl font-semibold tabular-nums" data-testid="budget-remaining">{money(budget.remaining)}</p>
            </div>
          </div>
          <div className="mt-4">
            <Meter share={budget.share} tone={budget.share >= 1 ? "red" : budget.share >= 0.8 ? "amber" : "green"} label="Budget used" />
            <p className="mt-1.5 text-xs text-ink-500">{percent(budget.share, 0)} of the budget used</p>
          </div>
        </>
      ) : (
        <p className="text-sm text-ink-600">
          {money(rules.spend_usd)} spent so far. No budget is set for this campaign, so it will not stop on spend.
        </p>
      )}
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-ink-100 pt-4 text-sm">
        <dt className="text-ink-500">Calling days</dt>
        <dd className="text-right font-medium text-ink-900">{rules.rules.calling_days.map(label).join(", ")}</dd>
        <dt className="text-ink-500">Calling hours</dt>
        <dd className="text-right font-medium text-ink-900">
          {rules.rules.window_start}–{rules.rules.window_end}
        </dd>
        <dt className="text-ink-500">Attempts per lead</dt>
        <dd className="text-right font-medium text-ink-900">{rules.rules.max_attempts}</dd>
        <dt className="text-ink-500">Daily call limit</dt>
        <dd className="text-right font-medium text-ink-900">{rules.rules.max_calls_per_day ?? "None"}</dd>
      </dl>
    </Card>
  );
}

function Objections({ report }: { report: Report }) {
  return (
    <Card>
      <CardTitle hint="Most frequent first. “Still converted” is how often a call with this objection ended in a meeting or sale.">Objections</CardTitle>
      {report.objections.length === 0 ? (
        <p className="text-sm text-ink-500">No objections have been recorded in reviewed calls yet.</p>
      ) : (
        <TableWrap>
          <thead className="bg-ink-50">
            <tr>
              <Th>Objection</Th>
              <Th className="text-right">Raised</Th>
              <Th>Handled</Th>
              <Th className="text-right">Still converted</Th>
              <Th>In their words</Th>
            </tr>
          </thead>
          <tbody>
            {report.objections.map((o) => (
              <tr key={o.category} className="border-t border-ink-100">
                <Td className="font-semibold text-ink-900">{label(o.category)}</Td>
                <Td className="text-right tabular-nums">{count(o.raised)}</Td>
                <Td>
                  <div className="flex min-w-32 items-center gap-2">
                    <Meter share={o.handled_rate ?? 0} tone={(o.handled_rate ?? 0) >= 0.6 ? "green" : (o.handled_rate ?? 0) >= 0.3 ? "amber" : "red"} label={`${label(o.category)} handled`} />
                    <span className="w-12 shrink-0 text-right tabular-nums">{percent(o.handled_rate, 0)}</span>
                  </div>
                </Td>
                <Td className="text-right tabular-nums">{percent(o.conversion_rate_when_raised, 0)}</Td>
                <Td className="max-w-xs text-ink-500">{o.examples[0] ? `“${o.examples[0]}”` : ""}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Card>
  );
}

function Breakdown({ title, hint, rows, empty }: { title: string; hint?: string; rows: [string, number][]; empty: string }) {
  const max = Math.max(1, ...rows.map(([, n]) => n));
  return (
    <Card>
      <CardTitle hint={hint}>{title}</CardTitle>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-500">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map(([name, n]) => (
            <li key={name}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-ink-800">{name}</span>
                <span className="tabular-nums text-ink-500">{count(n)}</span>
              </div>
              <Meter share={n / max} label={name} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function GroupTable({ title, hint, groups, nameOf, best }: { title: string; hint: string; groups: Report["by_language"]; nameOf: (key: string) => string; best?: string | null }) {
  const rows = Object.entries(groups);
  return (
    <Card>
      <CardTitle hint={hint}>{title}</CardTitle>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-500">No calls yet.</p>
      ) : (
        <TableWrap>
          <thead className="bg-ink-50">
            <tr>
              <Th />
              <Th className="text-right">Calls</Th>
              <Th className="text-right">Answered</Th>
              <Th className="text-right">Conversions</Th>
              <Th className="text-right">Conversion rate</Th>
              <Th>Sample</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([key, g]) => (
              <tr key={key} className="border-t border-ink-100">
                <Td className="font-semibold text-ink-900">
                  {nameOf(key)}
                  {best === key && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                      <Trophy className="size-3.5" aria-hidden="true" /> Best so far
                    </span>
                  )}
                </Td>
                <Td className="text-right tabular-nums">{count(g.calls)}</Td>
                <Td className="text-right tabular-nums">{count(g.answered)}</Td>
                <Td className="text-right tabular-nums">{count(g.conversions)}</Td>
                <Td className="text-right tabular-nums">{percent(g.conversion_rate)}</Td>
                <Td>{g.enough_data ? <Pill tone="green">Enough to compare</Pill> : <Pill tone="amber">Too few calls</Pill>}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </Card>
  );
}

export default function PerformancePage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent(use(params).name);
  const report = useApi(backendUrl(["campaigns", name, "report"]), reportSchema);
  const rules = useApi(backendUrl(["campaigns", name, "rules"]), rulesSchema);

  if ((report.loading && !report.data) || (rules.loading && !rules.data)) return <Loading what="Loading performance" />;
  if (report.error) return <ErrorState message={report.error.message} onRetry={report.reload} />;
  if (rules.error) return <ErrorState message={rules.error.message} onRetry={rules.reload} />;
  if (!report.data || !rules.data) return null;
  const r = report.data;

  return (
    <div className="space-y-6">
      {rules.data.stop_reason && (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900" role="status" data-testid="pause-reason">
          <PauseCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">This campaign paused itself</p>
            <p className="text-sm">Reason: {rules.data.stop_reason}.</p>
          </div>
        </div>
      )}

      {r.calls.total === 0 ? (
        <EmptyState title="No calls yet">Once this campaign places or receives calls, its results appear here.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Total calls" value={count(r.calls.total)} />
          <Stat label="Answered" value={count(r.calls.answered)} hint={`${count(r.calls.reviewed)} reviewed`} />
          <Stat label="Conversions" value={count(r.calls.conversions)} hint="Meetings booked and sales" />
          <Stat label="Conversion rate" value={percent(r.calls.conversion_rate)} hint="Of answered calls" />
          <Stat label="Cost per conversion" value={money(r.cost.cost_per_conversion)} hint={`${money(r.cost.spend_usd)} spent`} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <BudgetCard rules={rules.data} />
        <Card>
          <CardTitle hint="From what prospects said on their calls. Unscored leads have no evidence yet.">Lead quality</CardTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["hot", "warm", "cold", "unscored"] as const).map((category) => (
              <div key={category} className="rounded-xl bg-ink-50 p-4">
                <p className="text-sm text-ink-500">{label(category)}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{count(r.leads[category])}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-500">{count(r.leads.total)} leads in this campaign.</p>
        </Card>
      </div>

      {r.unsupported_statements.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5" role="alert">
          <p className="flex items-center gap-2 font-semibold text-red-800">
            <AlertTriangle className="size-5" aria-hidden="true" />
            {r.unsupported_statements.length} {r.unsupported_statements.length === 1 ? "statement" : "statements"} the playbook does not support
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-9 text-sm text-red-800">
            {r.unsupported_statements.slice(0, 5).map((u, i) => (
              <li key={i}>
                {u.statement} <span className="text-red-600">(call {u.call_run_id})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Objections report={r} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Breakdown title="Why calls were lost" rows={Object.entries(r.lost_reasons).map(([k, n]) => [label(k), n])} empty="No lost reasons recorded yet." />
        <Breakdown title="Competitors mentioned" hint="Names prospects said on calls." rows={Object.entries(r.competitors)} empty="No competitor has been named on a call yet." />
      </div>

      <GroupTable
        title="By playbook version"
        hint="A best version is named only when at least two versions each have 30 answered calls."
        groups={r.by_playbook_version}
        nameOf={(key) => (key === "unknown" ? "Before versions were tracked" : `Version ${key}`)}
        best={r.best_version}
      />
      <GroupTable title="By language" hint="The language the prospect mostly spoke." groups={r.by_language} nameOf={languageName} />

      {r.missed_opportunities.length > 0 && (
        <Card>
          <CardTitle hint="Buying signals or openings the agent did not act on, as noted by call reviews.">Missed opportunities</CardTitle>
          <ul className="divide-y divide-ink-100">
            {r.missed_opportunities.map((m) => (
              <li key={m.text} className="flex justify-between gap-6 py-2.5 text-sm">
                <span className="text-ink-800">{m.text}</span>
                <span className="shrink-0 tabular-nums text-ink-500">
                  {count(m.calls)} {m.calls === 1 ? "call" : "calls"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
