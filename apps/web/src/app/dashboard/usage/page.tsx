"use client";

import { useState } from "react";
import { Download, Receipt } from "lucide-react";
import { backendUrl, useApi } from "@/lib/api/client";
import { count, percent } from "@/lib/api/format";
import { economicsSchema, statementListSchema, statementSchema, type Economics, type Statement } from "@/lib/api/schemas";
import { Banner, DataTable, EmptyState, ErrorState, KeyValues, Loading, PageHeader, Panel, Select, Tag, buttonClass, type Column } from "@/components/dashboard/ui";
import { basisName, monthName, usd } from "./statement";

type Row = Statement["by_campaign"][number];

function StatementView({ period }: { period: string }) {
  const { data, error, loading, reload } = useApi(backendUrl(["usage", "statements", period]), statementSchema);
  if (loading && !data) return <Loading what="Loading the statement" strip={false} rows={5} />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data) return null;

  const columns: Column<Row>[] = [
    { key: "campaign", label: "Campaign", primary: true, sortValue: (r) => r.campaign.toLowerCase(), render: (r) => <span className="font-medium text-fg">{r.campaign || "Not tied to a campaign"}</span> },
    { key: "calls", label: "Calls", numeric: true, sortValue: (r) => r.calls, render: (r) => <span className="t-figure">{count(r.calls)}</span> },
    { key: "minutes", label: "Billed minutes", numeric: true, sortValue: (r) => Number(r.minutes), render: (r) => <span className="t-figure">{count(Number(r.minutes))}</span> },
    { key: "amount", label: "Amount", numeric: true, sortValue: (r) => Number(r.amount_usd), render: (r) => <span className="t-figure font-medium text-fg">{usd(r.amount_usd)}</span> },
  ];

  return (
    <div className="space-y-6" data-testid="statement">
      <Panel
        title={
          <span className="flex flex-wrap items-center gap-2">
            {monthName(period)}
            <Tag tone={data.status === "open" ? "warn" : "neutral"}>{data.status === "open" ? "Still open" : "Final"}</Tag>
          </span>
        }
        description={`Statement ${data.number} · ${data.organization.name === "default" ? "Default organization" : data.organization.name || "this organization"} · calendar month in UTC`}
        actions={
          <a href={backendUrl(["usage", "statements", period], { format: "csv" })} download className={buttonClass("secondary")}>
            <Download className="size-3.5" aria-hidden="true" />
            Every line (CSV)
          </a>
        }
      >
        <p className="t-label">Total</p>
        <p className="t-figure mt-1 text-[32px] font-semibold tracking-tight text-fg" data-testid="statement-total">
          {usd(data.total_usd)}
        </p>
        <KeyValues
          className="mt-4 max-w-xl"
          rows={[
            [`Calls: ${count(data.calls.count)}, ${count(Number(data.calls.minutes))} billed minutes`, <span key="c" className="t-figure">{usd(data.calls.amount_usd)}</span>],
            [`AI: ${count(data.ai.requests)} requests, ${count(data.ai.tokens)} tokens`, <span key="a" className="t-figure">{usd(data.ai.amount_usd)}</span>],
            [`Corrections: ${count(data.corrections.lines)}`, <span key="x" className="t-figure">{usd(data.corrections.amount_usd)}</span>],
          ]}
        />
        {data.by_basis.length > 0 && (
          <p className="t-meta mt-4 max-w-xl">
            Of the total: {data.by_basis.map((b) => `${usd(b.amount_usd)} ${basisName(b.basis)}`).join("; ")}.
          </p>
        )}
      </Panel>
      {data.status === "open" && (
        <Banner tone="info" title="This month is not over">
          Calls made from now on are added to it. A month that is over does not change: a later correction goes on the statement of the month it is made in.
        </Banner>
      )}
      <Panel flush title="By campaign">
        {data.by_campaign.length === 0 ? (
          <EmptyState icon={Receipt} title="Nothing was used this month">No calls were placed and no AI work was done.</EmptyState>
        ) : (
          <DataTable columns={columns} rows={data.by_campaign} rowKey={(r) => r.campaign_id ?? 0} caption="Usage by campaign" testId="statement-campaigns" initialSort={{ key: "amount", descending: true }} />
        )}
      </Panel>
      <p className="t-meta max-w-2xl">{data.what_this_is}</p>
    </div>
  );
}

type CampaignCost = Economics["by_campaign"][number];

/** A cost per meeting, with a mark when too few meetings stand behind it. */
function PerMeeting({ figures, least }: { figures: Economics["total"]; least: number }) {
  if (figures.cost_per_meeting_usd === null) return <span className="text-fg-3">No meeting yet</span>;
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-2">
      <span className="t-figure font-medium text-fg">{usd(figures.cost_per_meeting_usd)}</span>
      {!figures.enough_meetings && <Tag tone="warn">Fewer than {least} meetings</Tag>}
    </span>
  );
}

/** What a result cost over the last 30 days: counted from calls, summed from the ledger. */
function CostPerResult() {
  const { data, error, loading, reload } = useApi(backendUrl(["economics"], { days: 30 }), economicsSchema);
  if (loading && !data) return <Loading what="Loading costs" strip={false} rows={3} />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data || data.total.calls === 0) return null;
  const t = data.total;
  const columns: Column<CampaignCost>[] = [
    { key: "campaign", label: "Campaign", primary: true, sortValue: (r) => r.campaign.toLowerCase(), render: (r) => <span className="font-medium text-fg">{r.campaign || "Not tied to a campaign"}</span> },
    { key: "calls", label: "Calls", numeric: true, sortValue: (r) => r.calls, render: (r) => count(r.calls) },
    { key: "connected", label: "Connected", numeric: true, sortValue: (r) => r.connect_rate, render: (r) => percent(r.connect_rate) },
    { key: "meetings", label: "Meetings", numeric: true, sortValue: (r) => r.meetings, render: (r) => count(r.meetings) },
    { key: "spend", label: "Spent", numeric: true, sortValue: (r) => Number(r.spend_usd), render: (r) => usd(r.spend_usd) },
    { key: "per-call", label: "Per connected call", numeric: true, sortValue: (r) => Number(r.cost_per_connected_call_usd), render: (r) => usd(r.cost_per_connected_call_usd) },
    { key: "per-meeting", label: "Per meeting", numeric: true, sortValue: (r) => Number(r.cost_per_meeting_usd), render: (r) => <PerMeeting figures={r} least={data.min_meetings_for_a_cost} /> },
  ];
  return (
    <Panel title="What a result cost" description="The last 30 days. Counted from calls and summed from the same lines as the statement." flush>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-4 py-4 sm:grid-cols-4" data-testid="economics">
        {(
          [
            ["Per call placed", usd(t.cost_per_call_usd)],
            ["Per connected call", usd(t.cost_per_connected_call_usd)],
            ["Per billed minute", usd(t.cost_per_minute_usd)],
            ["Per booked meeting", <PerMeeting key="m" figures={t} least={data.min_meetings_for_a_cost} />],
          ] as const
        ).map(([name, value]) => (
          <div key={name}>
            <dt className="t-eyebrow">{name}</dt>
            <dd className="t-figure mt-0.5 text-[15px] font-medium text-fg">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="t-meta border-t border-line px-4 py-2.5">
        {count(t.calls)} calls, {percent(t.connect_rate)} connected, {count(t.meetings)} meetings.{t.ai_share ? ` AI is ${percent(t.ai_share)} of the cost.` : ""} Every call is counted in the cost of a meeting, the unanswered ones included.
      </p>
      {data.by_campaign.length > 1 && <DataTable columns={columns} rows={data.by_campaign} rowKey={(r) => r.campaign_id ?? 0} caption="Cost per result by campaign" testId="economics-campaigns" />}
    </Panel>
  );
}

export default function UsagePage() {
  const { data, error, loading, reload } = useApi(backendUrl(["usage", "statements"]), statementListSchema);
  const [chosen, setChosen] = useState<string | null>(null);
  const period = chosen ?? data?.[0]?.period ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usage"
        hint="statement"
        description="What this organization used, month by month: calls, AI, and any corrections."
        actions={
          data && data.length > 0 && period ? (
            <Select aria-label="Month" value={period} onChange={(e) => setChosen(e.target.value)} className="w-52">
              {data.map((m) => (
                <option key={m.period} value={m.period}>
                  {monthName(m.period)} · {usd(m.total_usd)}
                </option>
              ))}
            </Select>
          ) : undefined
        }
      />
      {loading && !data ? (
        <Loading what="Loading usage" strip={false} rows={4} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data && data.length === 0 ? (
        <EmptyState icon={Receipt} title="No usage yet">The first call writes the first line. Each month then gets a statement here.</EmptyState>
      ) : period ? (
        <>
          <StatementView key={period} period={period} />
          <CostPerResult />
        </>
      ) : null}
    </div>
  );
}
