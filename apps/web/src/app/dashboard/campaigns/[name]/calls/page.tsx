"use client";

import { use, useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDownLeft, ArrowUpRight, ExternalLink, PhoneOutgoing, Voicemail } from "lucide-react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { DASH, count, dateTime, duration, label, languageName, money } from "@/lib/api/format";
import { callDetailSchema, callListSchema, dialResultSchema, type CallDetail, type CallRow } from "@/lib/api/schemas";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { Banner, Button, Confirm, Drawer, EmptyState, ErrorState, Field, Input, Loading, NoticeBar, Panel, Segmented, Select, Skeleton, Status, Tag, type Notice } from "@/components/dashboard/ui";
import { cn } from "@/lib/cn";
import { useAccess } from "@/components/dashboard/access";

const ACTIVE = new Set(["created", "queued", "initiated", "ringing", "in-progress"]);
const CONVERTED = new Set(["meeting_booked", "sale_closed"]);
const TOOL_TEXT: Record<string, string> = {
  book_meeting: "Booked a meeting",
  schedule_callback: "Scheduled a callback",
  send_followup_sms: "Sent a follow-up text",
  mark_do_not_call: "Added the number to the do-not-call list",
  transfer_to_human: "Transferred to a person",
  lookup_knowledge: "Looked something up in the documents",
  log_call_outcome: "Logged the outcome",
  end_call: "Ended the call",
  language_switch: "Switched language",
};

function callState(call: Pick<CallRow, "status" | "disposition">) {
  if (ACTIVE.has(call.status)) return { tone: "pos" as const, text: call.status === "in-progress" ? "On the call" : label(call.status), live: true };
  if (call.disposition && CONVERTED.has(call.disposition)) return { tone: "pos" as const, text: label(call.disposition), live: false };
  if (call.status === "failed") return { tone: "crit" as const, text: call.disposition ? label(call.disposition) : "Failed", live: false };
  return { tone: "neutral" as const, text: label(call.disposition ?? call.status), live: false };
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="t-eyebrow mb-2">{children}</h3>;
}

function Detail({ row, detail }: { row: CallRow; detail: CallDetail }) {
  const review = detail.summary.review;
  const summary = review?.summary ?? detail.summary.agent_outcome?.summary;
  const nextAction = review?.next_action ?? detail.summary.agent_outcome?.next_step;
  const actions = detail.tool_events.filter((e) => e.tool !== "log_call_outcome" && e.tool !== "end_call");
  // While the call is going, keep the newest line in view.
  const newest = useRef<HTMLLIElement>(null);
  const lines = detail.transcript.length;
  useEffect(() => {
    if (detail.live && lines > 0) newest.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [detail.live, lines]);
  return (
    <div className="space-y-6">
      {detail.live && (
        <Banner tone="info" title="This call is in progress" role="status" testId="live-call">
          The transcript below fills in as people speak. The summary and assessment are written when the call ends.
        </Banner>
      )}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {[
          ["Started", dateTime(row.started_at), false],
          ["Length", duration(detail.duration_seconds), true],
          ["Direction", label(detail.direction), false],
          ["Language", detail.language ? languageName(detail.language) : DASH, false],
          ["Playbook version", row.playbook_version === null ? DASH : String(row.playbook_version), true],
          ["Estimated cost", money(row.cost_usd), true],
        ].map(([name, value, figure]) => (
          <div key={name as string}>
            <dt className="t-eyebrow">{name}</dt>
            <dd className={cn("mt-0.5 text-[13.5px] font-medium text-fg", figure && "t-figure")}>{value}</dd>
          </div>
        ))}
      </dl>

      {detail.error && (
        <Banner tone="crit" title="Something went wrong on this call">
          {detail.error}
        </Banner>
      )}

      {summary ? (
        <section>
          <Heading>Summary</Heading>
          <p className="text-[13.5px] leading-relaxed text-fg">{summary}</p>
        </section>
      ) : detail.transcript.length > 0 ? (
        <p className="text-[13px] text-fg-2">This call has not been reviewed yet. If the review failed, it is retried in the background.</p>
      ) : null}

      {nextAction && (
        <Banner tone="pos" title="Follow-up">
          {nextAction}
        </Banner>
      )}

      {detail.summary.handover && (
        <section data-testid="handover">
          <Heading>Handed to a person</Heading>
          <p className="text-[13.5px] leading-relaxed text-fg">{detail.summary.handover.agent_note || "The agent left no note for the colleague."}</p>
          {detail.summary.handover.prospect_last_said.length > 0 && (
            <>
              <p className="t-eyebrow mt-3">The last things they said</p>
              <ul className="mt-1 space-y-1 text-[13px] text-fg-2">
                {detail.summary.handover.prospect_last_said.map((line, i) => (
                  <li key={i}>“{line}”</li>
                ))}
              </ul>
            </>
          )}
          {detail.summary.handover.seconds_into_call !== null && <p className="t-meta mt-2">Transferred {duration(detail.summary.handover.seconds_into_call)} into the call.</p>}
        </section>
      )}

      {review && (
        <section>
          <Heading>Assessment</Heading>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-control border border-line bg-line sm:grid-cols-4">
            {[
              ["Interest", review.interest_level !== undefined ? `${review.interest_level} / 10` : DASH],
              ["Buying intent", review.buying_intent_score !== undefined ? `${review.buying_intent_score} / 100` : DASH],
              ["Agent quality", review.agent_quality_score !== undefined ? `${review.agent_quality_score} / 10` : DASH],
              ["Sentiment", review.customer_sentiment ? label(review.customer_sentiment) : DASH],
            ].map(([name, value]) => (
              <div key={name} className="bg-surface px-3 py-2.5">
                <dt className="t-eyebrow">{name}</dt>
                <dd className="t-figure mt-1 text-[14px] font-medium text-fg">{value}</dd>
              </div>
            ))}
          </dl>
          {review.ai_disclosed === false && detail.transcript.length > 0 && <p className="mt-2 text-[12.5px] font-medium text-fg">The review found no point where the agent said it is an AI assistant.</p>}
        </section>
      )}

      {(review?.objection_events?.length ?? 0) > 0 && (
        <section>
          <Heading>Objections</Heading>
          <ul className="divide-y divide-line border-y border-line">
            {review!.objection_events!.map((o, i) => (
              <li key={i} className="flex items-start justify-between gap-4 py-2 text-[13px]">
                <span className="min-w-0">
                  <span className="font-medium text-fg">{label(o.category)}</span>
                  <span dir="auto" className="block text-fg-2">“{o.quote}”</span>
                </span>
                <Status tone={o.handled ? "pos" : "crit"}>{o.handled ? "Handled" : "Not handled"}</Status>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(review?.incorrect_statements?.length ?? 0) > 0 && (
        <Banner tone="crit" title="Statements the playbook does not support">
          <ul className="list-disc space-y-0.5 pl-4">
            {review!.incorrect_statements!.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Banner>
      )}

      {[
        ["What the agent promised", review?.commitments_made_by_agent],
        ["Missed opportunities", review?.missed_opportunities],
        ["Coaching notes", review?.coaching_notes],
      ].map(([title, list]) =>
        Array.isArray(list) && list.length > 0 ? (
          <section key={title as string}>
            <Heading>{title as string}</Heading>
            <ul className="list-disc space-y-1 pl-4 text-[13px] text-fg-2">
              {list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null,
      )}

      {actions.length > 0 && (
        <section>
          <Heading>What the agent did</Heading>
          <ul className="space-y-1.5 text-[13px]">
            {actions.map((event, i) => (
              <li key={i} className="flex items-baseline justify-between gap-4">
                <span className="text-fg">{TOOL_TEXT[event.tool] ?? label(event.tool)}</span>
                {event.result.ok === false && <Status tone="crit">Did not succeed</Status>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <Heading>Transcript</Heading>
        {detail.transcript.length === 0 ? (
          <p className="text-[13px] text-fg-2">{detail.live ? "Nobody has spoken yet." : "Nobody spoke on this call."}</p>
        ) : (
          <ol className="space-y-2.5" data-testid="transcript" role={detail.live ? "log" : undefined} aria-label={detail.live ? "Live transcript" : undefined}>
            {detail.transcript.map((line, i) => {
              const prospect = line.role === "user";
              return (
                <li key={i} ref={i === lines - 1 ? newest : undefined} className={cn("flex", prospect ? "justify-end pl-8" : "pr-8")}>
                  <div dir="auto" className={cn("max-w-full rounded-panel px-3 py-2 text-[13.5px] leading-relaxed", prospect ? "bg-signal text-on-signal" : "bg-sunken text-fg")}>
                    <span className={cn("mb-0.5 block text-[10.5px] font-semibold uppercase tracking-[0.07em]", prospect ? "text-on-signal/75" : "text-fg-3")}>{prospect ? "Prospect" : "Agent"}</span>
                    {line.text}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {detail.recording_url && (
        <a href={detail.recording_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline">
          Open the recording at the phone provider <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

function DetailLoader({ row, onEnded }: { row: CallRow; onEnded: () => void }) {
  const { data, error, loading, reload } = useApi(backendUrl(["calls", row.call_run_id]), callDetailSchema);
  // A call in progress is followed as it happens; when it ends, the call log is refreshed once.
  const live = data?.live ?? false;
  const wasLive = useRef(false);
  useEffect(() => {
    if (live) {
      wasLive.current = true;
      const timer = setInterval(reload, 2000);
      return () => clearInterval(timer);
    }
    if (wasLive.current && data) {
      wasLive.current = false;
      onEnded();
    }
  }, [live, data, reload, onEnded]);
  if (loading && !data)
    return (
      <div className="space-y-3" role="status">
        <span className="sr-only">Loading call…</span>
        <Skeleton className="w-full" />
        <Skeleton className="w-4/5" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  return data ? <Detail row={row} detail={data} /> : null;
}

function DialForm({ campaign, onPlaced }: { campaign: string; onPlaced: (notice: Notice) => void }) {
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function ask(event: FormEvent) {
    event.preventDefault();
    if (phone.replace(/\D/g, "").length < 7) {
      setError("Enter the full number with its country code, for example +14155550100.");
      return;
    }
    setError(null);
    setConfirming(true);
  }

  async function place() {
    setBusy(true);
    setError(null);
    try {
      const placed = await apiRequest(backendUrl(["campaigns", campaign, "dial"], { phone: phone.trim(), first_name: firstName.trim() }), dialResultSchema, { method: "POST" });
      setConfirming(false);
      setPhone("");
      setFirstName("");
      onPlaced({ kind: "success", text: `Calling now. This is call ${placed.call_run_id}; it appears in the list below.` });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Call one number" description="Places a single call with this campaign's playbook, for a test or a manual follow-up">
      {confirming ? (
        <Confirm label="Confirm calling" confirmLabel="Yes, call now" busy={busy} error={error} onConfirm={place} onCancel={() => (setConfirming(false), setError(null))}>
          This places a real phone call to <span className="t-figure font-medium text-fg">{phone}</span> right now. The number is added to this campaign as a lead. Numbers on the do-not-call list are refused.
        </Confirm>
      ) : (
        <form onSubmit={ask} noValidate className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Phone number" error={error}>
            <Input type="tel" inputMode="tel" autoComplete="off" placeholder="+14155550100" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="First name (optional)">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={120} />
          </Field>
          <Button type="submit" variant="primary">
            <PhoneOutgoing className="size-3.5" aria-hidden="true" /> Call
          </Button>
        </form>
      )}
    </Panel>
  );
}

type Show = "all" | "answered" | "converted";

export default function CallsPage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent(use(params).name);
  const [direction, setDirection] = useState<"" | "outbound" | "inbound">("");
  const { data, error, loading, reload } = useApi(backendUrl(["campaigns", name, "calls"], { limit: 100, direction }), callListSchema);
  const [selected, setSelected] = useState<number | null>(null);
  const [show, setShow] = useState<Show>("all");
  const [notice, setNotice] = useState<Notice>(null);
  const wide = useMediaQuery("(min-width: 1024px)");
  const { canOperate } = useAccess();
  const closeNotice = useCallback(() => setNotice(null), []);
  const closeDetail = useCallback(() => setSelected(null), []);

  // While a call is ringing or in progress, keep the list current.
  const live = data?.some((call) => ACTIVE.has(call.status)) ?? false;
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(reload, 5000);
    return () => clearInterval(timer);
  }, [live, reload]);

  const rows = (data ?? []).filter((call) => show === "all" || (show === "answered" ? (call.duration_seconds ?? 0) > 0 && call.disposition !== "no_answer" && call.disposition !== "busy" : CONVERTED.has(call.disposition ?? "")));
  const current = rows.find((call) => call.call_run_id === selected) ?? (wide ? rows[0] : undefined);

  return (
    <div className="space-y-5">
      <NoticeBar notice={notice} onClose={closeNotice} />
      {canOperate && (
        <DialForm
          campaign={name}
          onPlaced={(n) => {
            setNotice(n);
            reload();
          }}
        />
      )}

      {loading && !data ? (
        <Loading what="Loading calls" strip={false} rows={8} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data && data.length === 0 && !direction ? (
        <EmptyState title="No calls yet">Calls appear here as soon as this campaign places or answers one.</EmptyState>
      ) : data ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] [&>*]:min-w-0">
          <Panel
            title="Call log"
            description={`${count(rows.length)} of the latest ${count(data.length)} calls${live ? " · updating live" : ""}`}
            actions={
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Select aria-label="Direction" value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)} className="h-8 w-auto">
                  <option value="">Outbound and inbound</option>
                  <option value="outbound">Outbound only</option>
                  <option value="inbound">Inbound only</option>
                </Select>
                <Segmented label="Show calls" value={show} onChange={setShow} options={[["all", "All"], ["answered", "Answered"], ["converted", "Converted"]]} />
              </div>
            }
            flush
          >
            {rows.length === 0 ? (
              <p className="px-4 py-4 text-[13px] text-fg-2">No call matches this filter.</p>
            ) : (
              <ul className="divide-y divide-line lg:max-h-[70dvh] lg:overflow-y-auto" data-testid="call-log">
                {rows.map((call) => {
                  const state = callState(call);
                  const active = current?.call_run_id === call.call_run_id;
                  const Direction = call.mode === "voicemail" ? Voicemail : call.direction === "inbound" ? ArrowDownLeft : ArrowUpRight;
                  return (
                    <li key={call.call_run_id}>
                      <button type="button" onClick={() => setSelected(call.call_run_id)} aria-current={active && wide ? "true" : undefined} className={cn("relative flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-sunken", active && wide && "bg-sunken")}>
                        {active && wide && <span className="absolute inset-y-0 left-0 w-1 bg-signal" aria-hidden="true" />}
                        <Direction className="mt-0.5 size-3.5 shrink-0 text-fg-3" aria-label={call.mode === "voicemail" ? "Voicemail" : label(call.direction)} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="truncate text-[13.5px] font-medium text-fg">{call.lead || <span className="t-figure">{call.phone}</span>}</span>
                            <span className="t-figure shrink-0 text-[12px] text-fg-3">{duration(call.duration_seconds)}</span>
                          </span>
                          <span className="mt-0.5 flex items-center justify-between gap-3">
                            <Status tone={state.tone} live={state.live}>
                              {state.text}
                            </Status>
                            <span className="t-meta shrink-0">{dateTime(call.started_at)}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {wide &&
            (current ? (
              <Panel
                key={current.call_run_id}
                title={current.lead || current.phone}
                description={<span className="t-figure">{current.phone}</span>}
                actions={
                  <>
                    {current.language && <Tag>{languageName(current.language)}</Tag>}
                    <Status tone={callState(current).tone} live={callState(current).live}>
                      {callState(current).text}
                    </Status>
                  </>
                }
              >
                <DetailLoader row={current} onEnded={reload} />
              </Panel>
            ) : (
              <EmptyState title="Select a call">Its transcript, summary and follow-up appear here.</EmptyState>
            ))}
        </div>
      ) : null}

      {!wide && selected !== null && current && (
        <Drawer label="Call details" title={current.lead || current.phone} subtitle={`${current.phone} · ${callState(current).text}`} onClose={closeDetail}>
          <DetailLoader row={current} onEnded={reload} />
        </Drawer>
      )}
    </div>
  );
}
