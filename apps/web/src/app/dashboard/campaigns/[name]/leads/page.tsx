"use client";

import { use, useCallback, useEffect, useState } from "react";
import { Check, Minus, Search, X } from "lucide-react";
import { backendUrl, useApi } from "@/lib/api/client";
import { DASH, FACTOR_LABELS, count, dateTime, duration, label, languageName } from "@/lib/api/format";
import { leadDetailSchema, leadListSchema, type Lead, type LeadDetail } from "@/lib/api/schemas";
import { Banner, Button, DataTable, Drawer, EmptyState, ErrorState, Field, Input, KeyValues, Loading, Segmented, Select, Skeleton, Status, Tag, type Column, type Tone } from "@/components/dashboard/ui";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 25;
const CATEGORY_TONE: Record<Lead["category"], Tone> = { hot: "crit", warm: "warn", cold: "info", unscored: "neutral" };
const INTENT_TONE: Record<string, Tone> = { high: "pos", medium: "warn", low: "neutral" };
const STATUSES = ["pending", "calling", "callback", "completed", "failed", "dnc"];
const statusText = (status: string) => (status === "dnc" ? "Do not call" : label(status));

function Score({ lead, large = false }: { lead: Pick<Lead, "score" | "category">; large?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("t-figure text-right font-medium text-fg", large ? "text-[26px] leading-none" : "w-7 text-[14px]")}>{lead.score ?? DASH}</span>
      <Tag tone={CATEGORY_TONE[lead.category]}>{label(lead.category)}</Tag>
    </span>
  );
}

function Evidence({ value }: { value: string | undefined }) {
  if (value === "yes" || value === "now" || value === "this_quarter") return <Check className="size-3.5 text-pos" aria-hidden="true" />;
  if (value === "no" || value === "none") return <X className="size-3.5 text-crit" aria-hidden="true" />;
  return <Minus className="size-3.5 text-fg-3" aria-hidden="true" />;
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="t-eyebrow mb-2">{children}</h3>;
}

function Profile({ data }: { data: LeadDetail }) {
  const [openCall, setOpenCall] = useState<number | null>(null);
  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between">
          <Heading>Qualification score</Heading>
          <Score lead={data} large />
        </div>
        {data.score === null ? (
          <p className="text-[13px] text-fg-2">No score yet: no call has given evidence about this lead.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {Object.entries(FACTOR_LABELS).map(([factor, text]) => {
              const value = data.evidence[factor as keyof typeof data.evidence] as string | undefined;
              return (
                <li key={factor} className="flex items-center gap-2.5 py-2 text-[13px]">
                  <Evidence value={value} />
                  <span className="flex-1 text-fg">{text}</span>
                  <span className="text-fg-3">{label(value ?? "unknown")}</span>
                  <span className="t-figure w-10 text-right font-medium text-fg">+{data.points[factor] ?? 0}</span>
                </li>
              );
            })}
          </ul>
        )}
        {(data.evidence.quotes?.length ?? 0) > 0 && (
          <ul className="mt-3 space-y-1.5">
            {data.evidence.quotes!.map((q) => (
              <li key={q} dir="auto" className="border-l-[3px] border-signal pl-3 text-[13px] text-fg-2">
                “{q}”
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.next_action && (
        <Banner tone="pos" title="Recommended next action">
          {data.next_action}
        </Banner>
      )}

      <KeyValues
        rows={[
          ["Buying intent", data.buying_intent ? `${label(data.buying_intent)} (${data.buying_intent_score})` : "Not assessed"],
          ["Status", `${statusText(data.status)}${data.last_disposition ? ` · ${label(data.last_disposition)}` : ""}`],
          ["Attempts", <span key="a" className="t-figure">{data.attempts}</span>],
          ...(data.lost_reason ? [["Lost because", label(data.lost_reason)] as [string, string]] : []),
        ]}
      />

      {data.objections.length > 0 && (
        <section>
          <Heading>Objections</Heading>
          <ul className="divide-y divide-line border-y border-line">
            {data.objections.map((o) => (
              <li key={o.category} className="py-2.5 text-[13px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-fg">{label(o.category)}</span>
                  <Status tone={o.handled === o.raised ? "pos" : o.handled > 0 ? "warn" : "crit"}>
                    {o.handled} of {o.raised} handled
                  </Status>
                </div>
                {o.quotes[0] && <p dir="auto" className="mt-1 text-fg-2">“{o.quotes[0]}”</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.pain_points.length > 0 && (
        <section>
          <Heading>Problems they mentioned</Heading>
          <ul className="list-disc space-y-1 pl-4 text-[13px] text-fg-2">
            {data.pain_points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="t-eyebrow mb-2">Calls ({data.call_history.length})</h3>
        {data.call_history.length === 0 ? (
          <p className="text-[13px] text-fg-2">This lead has not been called yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-line pl-4">
            {data.call_history.map((call) => (
              <li key={call.call_run_id} className="relative text-[13px]">
                <span className="absolute -left-[19px] top-1.5 size-1.5 rounded-[1px] bg-fg-3" aria-hidden="true" />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-fg-3">
                  <span className="font-medium text-fg">{dateTime(call.started_at)}</span>
                  <span>{label(call.direction)}</span>
                  <span className="t-figure">{duration(call.duration_seconds)}</span>
                  {call.language && <span>{languageName(call.language)}</span>}
                  {call.disposition && <Tag>{label(call.disposition)}</Tag>}
                </div>
                {call.summary && <p className="mt-1.5 text-fg-2">{call.summary}</p>}
                {call.transcript.length > 0 && (
                  <>
                    <button type="button" className="mt-1.5 text-[12.5px] font-medium text-accent hover:underline" aria-expanded={openCall === call.call_run_id} onClick={() => setOpenCall(openCall === call.call_run_id ? null : call.call_run_id)}>
                      {openCall === call.call_run_id ? "Hide transcript" : "Show transcript"}
                    </button>
                    {openCall === call.call_run_id && (
                      <ol className="mt-2 animate-rise space-y-2 rounded-control bg-sunken p-3">
                        {call.transcript.map((line, i) => (
                          <li key={i} dir="auto">
                            <span className="t-eyebrow mr-2">{line.role === "user" ? "Prospect" : "Agent"}</span>
                            <span className="text-fg">{line.text}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function LeadDrawer({ campaign, leadId, onClose }: { campaign: string; leadId: number; onClose: () => void }) {
  const { data, error, loading, reload } = useApi(backendUrl(["campaigns", campaign, "leads", leadId]), leadDetailSchema);
  return (
    <Drawer label="Lead details" title={data?.name || data?.phone || "Lead"} subtitle={data ? [data.company, data.phone, data.email].filter(Boolean).join(" · ") : undefined} onClose={onClose}>
      {loading && !data ? (
        <div className="space-y-3" role="status">
          <span className="sr-only">Loading lead…</span>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="w-full" />
          <Skeleton className="w-5/6" />
          <Skeleton className="w-2/3" />
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data ? (
        <Profile data={data} />
      ) : null}
    </Drawer>
  );
}

export default function LeadsPage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent(use(params).name);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [intent, setIntent] = useState("");
  const [minScore, setMinScore] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const close = useCallback(() => setSelected(null), []);

  // Search as the person types, without a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => setPage(0), [category, status, intent, minScore, query]);

  const { data, error, loading, reload } = useApi(backendUrl(["campaigns", name, "leads"], { category, status, intent, min_score: minScore, q: query, limit: PAGE_SIZE, offset: page * PAGE_SIZE }), leadListSchema);
  const filtered = Boolean(category || status || intent || minScore || query);
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const clear = () => (setCategory(""), setStatus(""), setIntent(""), setMinScore(""), setSearch(""));

  const columns: Column<Lead>[] = [
    {
      key: "lead",
      label: "Lead",
      primary: true,
      render: (lead) => (
        <span className="block">
          <button type="button" className="text-left font-medium text-fg hover:underline" onClick={(e) => (e.stopPropagation(), setSelected(lead.id))}>
            {lead.name || lead.phone}
          </button>
          <span className="t-meta block">{lead.company || <span className="t-figure">{lead.phone}</span>}</span>
        </span>
      ),
    },
    { key: "score", label: "Score", render: (lead) => <Score lead={lead} /> },
    { key: "intent", label: "Buying intent", render: (lead) => (lead.buying_intent ? <Status tone={INTENT_TONE[lead.buying_intent]}>{label(lead.buying_intent)}</Status> : <span className="text-fg-3">{DASH}</span>) },
    {
      key: "status",
      label: "Status",
      render: (lead) => (
        <span className="block">
          {statusText(lead.status)}
          {lead.lost_reason && <span className="t-meta block">Lost: {label(lead.lost_reason)}</span>}
        </span>
      ),
    },
    { key: "calls", label: "Calls", numeric: true, render: (lead) => count(lead.calls) },
    { key: "next", label: "Next action", render: (lead) => lead.next_action ?? null, className: "sm:max-w-80" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-3">
        <Segmented label="Lead quality" value={category} onChange={setCategory} options={[["", "All"], ["hot", "Hot"], ["warm", "Warm"], ["cold", "Cold"], ["unscored", "Unscored"]]} />
        <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-3">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Any</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusText(s)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Buying intent">
            <Select value={intent} onChange={(e) => setIntent(e.target.value)}>
              <option value="">Any</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </Field>
          <Field label="Minimum score" className="max-sm:col-span-2">
            <Select value={minScore} onChange={(e) => setMinScore(e.target.value)}>
              <option value="">Any</option>
              {[20, 40, 60, 70, 80].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Search leads" className="w-full min-w-48 flex-1 sm:w-auto">
          <span className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-3" aria-hidden="true" />
            <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, company or phone" className="pl-8" />
          </span>
        </Field>
      </div>

      {loading && !data ? (
        <Loading what="Loading leads" strip={false} rows={8} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data && data.total === 0 ? (
        filtered ? (
          <EmptyState title="No leads match these filters" action={<Button onClick={clear}>Clear filters</Button>}>
            Change or clear the filters to see more leads.
          </EmptyState>
        ) : (
          <EmptyState title="No leads in this campaign yet">
            Import a lead sheet on the calling engine with <code className="t-figure rounded-chip bg-sunken px-1">callagent leads import</code>.
          </EmptyState>
        )
      ) : data ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="t-meta" aria-live="polite" data-testid="lead-count">
              {count(data.total)} {data.total === 1 ? "lead" : "leads"}
              {filtered ? " match" : ""}
            </p>
            {filtered && (
              <Button variant="ghost" size="sm" onClick={clear}>
                Clear filters
              </Button>
            )}
          </div>
          <div className={cn("rounded-panel border border-line bg-surface transition-opacity", loading && "opacity-60")}>
            <DataTable columns={columns} rows={data.leads} rowKey={(lead) => lead.id} caption="Leads" onRowClick={(lead) => setSelected(lead.id)}
              mobileRow={(lead) => (
                <span className="block">
                  <span className="flex items-center justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium text-fg">{lead.name || lead.phone}</span>
                      <span className="t-meta block truncate">{lead.company || lead.phone}</span>
                    </span>
                    <Score lead={lead} />
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-fg-2">
                    <span>{statusText(lead.status)}</span>
                    {lead.buying_intent && <Status tone={INTENT_TONE[lead.buying_intent]}>{label(lead.buying_intent)} intent</Status>}
                    {lead.lost_reason && <span className="text-fg-3">Lost: {label(lead.lost_reason)}</span>}
                  </span>
                  {lead.next_action && <span className="mt-1 line-clamp-2 text-[12.5px] text-fg-3">{lead.next_action}</span>}
                </span>
              )}
            />
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <Button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                Previous
              </Button>
              <span className="t-meta">
                <span className="t-figure text-fg-2">
                  {page * PAGE_SIZE + 1}–{Math.min(data.total, (page + 1) * PAGE_SIZE)}
                </span>{" "}
                of {count(data.total)} · page {page + 1} of {pages}
              </span>
              <Button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}>
                Next
              </Button>
            </div>
          )}
        </>
      ) : null}

      {selected !== null && <LeadDrawer campaign={name} leadId={selected} onClose={close} />}
    </div>
  );
}
