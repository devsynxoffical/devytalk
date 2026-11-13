"use client";

import { use, useEffect, useState } from "react";
import { Check, ChevronRight, HelpCircle, X } from "lucide-react";
import { backendUrl, useApi } from "@/lib/api/client";
import { DASH, FACTOR_LABELS, count, dateTime, duration, label, languageName } from "@/lib/api/format";
import { leadDetailSchema, leadListSchema, type Lead } from "@/lib/api/schemas";
import { Button, Card, EmptyState, ErrorState, Loading, Pill, TableWrap, Td, Th, type Tone } from "@/components/dashboard/ui";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 25;
const CATEGORY_TONE: Record<Lead["category"], Tone> = { hot: "red", warm: "amber", cold: "blue", unscored: "gray" };
const INTENT_TONE: Record<string, Tone> = { high: "green", medium: "amber", low: "gray" };
const STATUSES = ["pending", "calling", "callback", "completed", "failed", "dnc"];
const selectClass = "h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

function ScoreBadge({ lead }: { lead: Pick<Lead, "score" | "category"> }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-8 text-right text-base font-semibold tabular-nums text-ink-900">{lead.score ?? DASH}</span>
      <Pill tone={CATEGORY_TONE[lead.category]}>{label(lead.category)}</Pill>
    </span>
  );
}

function EvidenceIcon({ value }: { value: string | undefined }) {
  if (value === "yes" || value === "now" || value === "this_quarter") return <Check className="size-4 text-brand-600" aria-hidden="true" />;
  if (value === "no" || value === "none") return <X className="size-4 text-red-500" aria-hidden="true" />;
  return <HelpCircle className="size-4 text-ink-300" aria-hidden="true" />;
}

function LeadPanel({ campaign, leadId, onClose }: { campaign: string; leadId: number; onClose: () => void }) {
  const { data, error, loading, reload } = useApi(backendUrl(["campaigns", campaign, "leads", leadId]), leadDetailSchema);
  const [openCall, setOpenCall] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/30" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Lead details"
        className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink-900">{data?.name || data?.phone || "Lead"}</h2>
            {data && <p className="text-sm text-ink-500">{[data.company, data.phone, data.email].filter(Boolean).join(" · ")}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-50">
            <X className="size-5" />
          </button>
        </div>

        {loading && !data ? (
          <Loading what="Loading lead" />
        ) : error ? (
          <div className="mt-6">
            <ErrorState message={error.message} onRetry={reload} />
          </div>
        ) : data ? (
          <div className="mt-6 space-y-6">
            <section>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink-900">Qualification score</h3>
                <ScoreBadge lead={data} />
              </div>
              {data.score === null ? (
                <p className="mt-2 text-sm text-ink-500">No score yet: no call has given evidence about this lead.</p>
              ) : (
                <ul className="mt-3 divide-y divide-ink-100 rounded-xl border border-ink-100">
                  {Object.entries(FACTOR_LABELS).map(([factor, text]) => {
                    const value = data.evidence[factor as keyof typeof data.evidence] as string | undefined;
                    return (
                      <li key={factor} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                        <EvidenceIcon value={value} />
                        <span className="flex-1 text-ink-800">{text}</span>
                        <span className="text-ink-500">{label(value ?? "unknown")}</span>
                        <span className="w-12 text-right font-semibold tabular-nums text-ink-900">+{data.points[factor] ?? 0}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {(data.evidence.quotes?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">What they said</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {data.evidence.quotes!.map((q) => (
                      <li key={q} className="border-l-2 border-brand-300 pl-3 text-sm text-ink-700">“{q}”</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="text-ink-500">Buying intent</p>
                <p className="mt-0.5 font-semibold text-ink-900">
                  {data.buying_intent ? `${label(data.buying_intent)} (${data.buying_intent_score})` : "Not assessed"}
                </p>
              </div>
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="text-ink-500">Status</p>
                <p className="mt-0.5 font-semibold text-ink-900">
                  {label(data.status)}
                  {data.last_disposition ? ` · ${label(data.last_disposition)}` : ""}
                </p>
              </div>
            </section>

            {data.next_action && (
              <section className="rounded-xl border border-brand-200 bg-brand-50 p-4">
                <h3 className="text-sm font-semibold text-brand-900">Recommended next action</h3>
                <p className="mt-1 text-sm text-brand-900">{data.next_action}</p>
              </section>
            )}

            {(data.objections.length > 0 || data.lost_reason) && (
              <section>
                <h3 className="font-semibold text-ink-900">Objections</h3>
                {data.lost_reason && <p className="mt-1 text-sm text-ink-600">Lost because: {label(data.lost_reason)}</p>}
                <ul className="mt-2 space-y-2">
                  {data.objections.map((o) => (
                    <li key={o.category} className="rounded-xl border border-ink-100 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink-900">{label(o.category)}</span>
                        <Pill tone={o.handled === o.raised ? "green" : o.handled > 0 ? "amber" : "red"}>
                          {o.handled} of {o.raised} handled
                        </Pill>
                      </div>
                      {o.quotes[0] && <p className="mt-1 text-ink-600">“{o.quotes[0]}”</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.pain_points.length > 0 && (
              <section>
                <h3 className="font-semibold text-ink-900">Problems they mentioned</h3>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-ink-700">
                  {data.pain_points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h3 className="font-semibold text-ink-900">Calls ({data.call_history.length})</h3>
              {data.call_history.length === 0 ? (
                <p className="mt-1 text-sm text-ink-500">This lead has not been called yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {data.call_history.map((call) => (
                    <li key={call.call_run_id} className="rounded-xl border border-ink-100 p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-500">
                        <span className="font-semibold text-ink-900">{dateTime(call.started_at)}</span>
                        <span>{label(call.direction)}</span>
                        <span>{duration(call.duration_seconds)}</span>
                        {call.language && <span>{languageName(call.language)}</span>}
                        {call.disposition && <Pill>{label(call.disposition)}</Pill>}
                      </div>
                      {call.summary && <p className="mt-2 text-ink-700">{call.summary}</p>}
                      {call.transcript.length > 0 && (
                        <>
                          <button
                            type="button"
                            className="mt-2 text-sm font-semibold text-brand-700 hover:underline"
                            aria-expanded={openCall === call.call_run_id}
                            onClick={() => setOpenCall(openCall === call.call_run_id ? null : call.call_run_id)}
                          >
                            {openCall === call.call_run_id ? "Hide transcript" : "Show transcript"}
                          </button>
                          {openCall === call.call_run_id && (
                            <ol className="mt-2 space-y-1.5 rounded-lg bg-ink-50 p-3">
                              {call.transcript.map((line, i) => (
                                <li key={i} className="text-ink-700">
                                  <span className="font-semibold text-ink-900">{line.role === "user" ? "Prospect" : "Agent"}: </span>
                                  {line.text}
                                </li>
                              ))}
                            </ol>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </aside>
    </div>
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

  // Search as the person types, without a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => setPage(0), [category, status, intent, minScore, query]);

  const url = backendUrl(["campaigns", name, "leads"], {
    category,
    status,
    intent,
    min_score: minScore,
    q: query,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });
  const { data, error, loading, reload } = useApi(url, leadListSchema);
  const filtered = Boolean(category || status || intent || minScore || query);
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <Card className="!p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div role="group" aria-label="Lead quality" className="inline-flex rounded-lg border border-ink-200 p-0.5">
            {[["", "All"], ["hot", "Hot"], ["warm", "Warm"], ["cold", "Cold"], ["unscored", "Unscored"]].map(([value, text]) => (
              <button
                key={value}
                type="button"
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
                className={cn("rounded-md px-3 py-1.5 text-sm font-semibold", category === value ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50")}
              >
                {text}
              </button>
            ))}
          </div>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-ink-500">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
              <option value="">Any</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "dnc" ? "Do not call" : label(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-ink-500">Buying intent</span>
            <select value={intent} onChange={(e) => setIntent(e.target.value)} className={selectClass}>
              <option value="">Any</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-ink-500">Minimum score</span>
            <select value={minScore} onChange={(e) => setMinScore(e.target.value)} className={selectClass}>
              <option value="">Any</option>
              {[20, 40, 60, 70, 80].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-48 flex-1 text-sm">
            <span className="mb-1 block text-xs font-medium text-ink-500">Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, company or phone"
              className={cn(selectClass, "w-full")}
            />
          </label>
        </div>
      </Card>

      {loading && !data ? (
        <Loading what="Loading leads" />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data && data.total === 0 ? (
        filtered ? (
          <EmptyState title="No leads match these filters">Change or clear the filters to see more leads.</EmptyState>
        ) : (
          <EmptyState title="No leads in this campaign yet">
            Import a lead sheet on the calling engine with <code>callagent leads import</code>.
          </EmptyState>
        )
      ) : data ? (
        <>
          <p className="text-sm text-ink-500" aria-live="polite">
            {count(data.total)} {data.total === 1 ? "lead" : "leads"}
            {filtered ? " match" : ""}
          </p>
          <TableWrap>
            <thead className="bg-ink-50">
              <tr>
                <Th>Lead</Th>
                <Th>Score</Th>
                <Th>Buying intent</Th>
                <Th>Status</Th>
                <Th>Recommended next action</Th>
                <Th />
              </tr>
            </thead>
            <tbody className={cn(loading && "opacity-60")}>
              {data.leads.map((lead) => (
                <tr key={lead.id} className="cursor-pointer border-t border-ink-100 hover:bg-brand-50/40" onClick={() => setSelected(lead.id)}>
                  <Td>
                    <button type="button" className="text-left font-semibold text-ink-900 hover:underline" onClick={() => setSelected(lead.id)}>
                      {lead.name || lead.phone}
                    </button>
                    <span className="block text-ink-500">{lead.company || lead.phone}</span>
                  </Td>
                  <Td>
                    <ScoreBadge lead={lead} />
                  </Td>
                  <Td>{lead.buying_intent ? <Pill tone={INTENT_TONE[lead.buying_intent]}>{label(lead.buying_intent)}</Pill> : <span className="text-ink-400">{DASH}</span>}</Td>
                  <Td>
                    {lead.status === "dnc" ? "Do not call" : label(lead.status)}
                    {lead.lost_reason && <span className="block text-xs text-ink-500">Lost: {label(lead.lost_reason)}</span>}
                  </Td>
                  <Td className="max-w-xs">{lead.next_action ?? <span className="text-ink-400">{DASH}</span>}</Td>
                  <Td>
                    <ChevronRight className="size-4 text-ink-300" aria-hidden="true" />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          {pages > 1 && (
            <div className="flex items-center justify-between">
              <Button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                Previous
              </Button>
              <span className="text-sm text-ink-500">
                Page {page + 1} of {pages}
              </span>
              <Button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}>
                Next
              </Button>
            </div>
          )}
        </>
      ) : null}

      {selected !== null && <LeadPanel campaign={name} leadId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
