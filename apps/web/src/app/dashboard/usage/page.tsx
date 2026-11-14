"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { backendUrl, useApi } from "@/lib/api/client";
import { count } from "@/lib/api/format";
import { statementListSchema, statementSchema, type Statement } from "@/lib/api/schemas";
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
        description={`Statement ${data.number} · ${data.organization.name || "this organization"} · calendar month in UTC`}
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
          <EmptyState title="Nothing was used this month">No calls were placed and no AI work was done.</EmptyState>
        ) : (
          <DataTable columns={columns} rows={data.by_campaign} rowKey={(r) => r.campaign_id ?? 0} caption="Usage by campaign" testId="statement-campaigns" initialSort={{ key: "amount", descending: true }} />
        )}
      </Panel>
      <p className="t-meta max-w-2xl">{data.what_this_is}</p>
    </div>
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
        <EmptyState title="No usage yet">The first call writes the first line. Each month then gets a statement here.</EmptyState>
      ) : period ? (
        <StatementView key={period} period={period} />
      ) : null}
    </div>
  );
}
