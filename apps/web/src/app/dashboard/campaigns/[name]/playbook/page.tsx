"use client";

import { use, useCallback, useState } from "react";
import { Minus, Plus, Sparkles } from "lucide-react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { dateTime } from "@/lib/api/format";
import { coachResultSchema, versionDiffSchema, versionListSchema, versionSchema, type CoachResult, type Version } from "@/lib/api/schemas";
import { Banner, Button, Confirm, EmptyState, ErrorState, Field, Loading, NoticeBar, Panel, Skeleton, Status, Textarea, type Notice, type Tone } from "@/components/dashboard/ui";

const STATE: Record<Version["status"], { text: string; tone: Tone }> = {
  active: { text: "Live", tone: "pos" },
  draft: { text: "Awaiting your approval", tone: "warn" },
  archived: { text: "Earlier version", tone: "neutral" },
  rejected: { text: "Rejected", tone: "crit" },
};

const SOURCES: Record<string, string> = {
  coach: "Proposed by the AI coach",
  training: "Built from your documents",
  onboarding: "Written during setup",
  onboard: "Written during setup",
  import: "Imported",
  manual: "Edited by hand",
  api: "Sent through the API",
  existing: "In use before version history",
};

// The dashboard has no personal accounts yet, so approvals are recorded against the dashboard.
const APPROVER = "dashboard";
const failure = (error: unknown) => (error instanceof ApiError ? error.message : "Something went wrong. Try again.");

function Diff({ campaign, version }: { campaign: string; version: number }) {
  const { data, error, loading, reload } = useApi(backendUrl(["campaigns", campaign, "versions", version, "diff"]), versionDiffSchema);
  if (loading && !data)
    return (
      <div className="space-y-2" role="status">
        <span className="sr-only">Comparing with the live version…</span>
        <Skeleton className="w-1/3" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data) return null;
  if (data.changes.length === 0) return <p className="text-[13px] text-fg-2">This version says the same as the live one in every part that is compared.</p>;
  return (
    <div className="animate-rise space-y-4" data-testid="version-diff">
      <p className="t-meta">Compared with {data.compared_with === null ? "the live playbook" : `version ${data.compared_with}, which is live`}.</p>
      {data.changes.map((change) => (
        <div key={change.field}>
          <p className="t-eyebrow mb-1.5">{change.label}</p>
          <ul className="overflow-hidden rounded-control border border-line text-[13px]">
            {change.removed.map((line) => (
              <li key={`r-${line}`} className="flex gap-2 border-b border-line bg-crit-bg/60 px-3 py-2 last:border-0">
                <Minus className="mt-0.5 size-3.5 shrink-0 text-crit" aria-label="Removed" />
                <span dir="auto" className="break-words text-fg-2 line-through decoration-crit/40">{line}</span>
              </li>
            ))}
            {change.added.map((line) => (
              <li key={`a-${line}`} className="flex gap-2 border-b border-line bg-pos-bg/60 px-3 py-2 last:border-0">
                <Plus className="mt-0.5 size-3.5 shrink-0 text-pos" aria-label="Added" />
                <span dir="auto" className="break-words text-fg">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function VersionPanel({ campaign, version, onChanged }: { campaign: string; version: Version; onChanged: (notice: Notice) => void }) {
  const [showDiff, setShowDiff] = useState(false);
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = STATE[version.status];
  const blocked = version.blocking_questions.length > 0;
  const rollback = version.status === "archived";
  const cancel = () => (setPending(null), setError(null));

  async function decide(action: "approve" | "reject") {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(backendUrl(["campaigns", campaign, "versions", version.version, action]), versionSchema, {
        method: "POST",
        body: action === "approve" ? { approved_by: APPROVER } : { approved_by: APPROVER, reason: reason.trim() },
      });
      setPending(null);
      onChanged({ kind: "success", text: action === "reject" ? `Version ${version.version} was rejected. Calls are unchanged.` : `Version ${version.version} is now live. New calls use it.` });
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      title={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1" data-testid={`version-${version.version}`}>
          Version <span className="t-figure -ml-1.5">{version.version}</span>
          <Status tone={state.tone}>{state.text}</Status>
        </span>
      }
      description={`${SOURCES[version.source] ?? version.source} · ${dateTime(version.created_at)}${version.status === "active" && version.activated_at ? ` · live since ${dateTime(version.activated_at)}` : ""}`}
      actions={
        version.status !== "active" ? (
          <Button size="sm" onClick={() => setShowDiff((v) => !v)} aria-expanded={showDiff}>
            {showDiff ? "Hide changes" : "See what changes"}
          </Button>
        ) : undefined
      }
    >
      {(version.changes.length > 0 || version.note || (blocked && version.status !== "rejected") || showDiff || version.status === "draft" || rollback) && (
      <div className="space-y-4">
        {version.changes.length > 0 && (
          <div>
            <p className="t-eyebrow mb-2">Recommendations and the evidence behind them</p>
            <ol className="divide-y divide-line border-y border-line">
              {version.changes.map((c, i) => (
                <li key={c.change} className="flex gap-3 py-2.5 text-[13px]">
                  <span className="t-figure w-4 shrink-0 text-fg-3">{i + 1}</span>
                  <span>
                    <span className="font-medium text-fg">{c.change}</span>
                    <span className="mt-0.5 block text-fg-2">Evidence: {c.evidence}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {version.changes.length === 0 && version.note && <p className="whitespace-pre-line text-[13px] text-fg-2">{version.note}</p>}

        {blocked && version.status !== "rejected" && (
          <Banner tone="warn" title="Questions that must be answered before this version can go live">
            <ul className="list-disc space-y-0.5 pl-4">
              {version.blocking_questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </Banner>
        )}

        {showDiff && <Diff campaign={campaign} version={version.version} />}

        {(version.status === "draft" || rollback) &&
          (pending === null ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" disabled={blocked} onClick={() => setPending("approve")}>
                {rollback ? `Roll back to version ${version.version}` : "Approve and publish"}
              </Button>
              {version.status === "draft" && (
                <Button variant="danger" onClick={() => setPending("reject")}>
                  Reject
                </Button>
              )}
            </div>
          ) : pending === "approve" ? (
            <Confirm label="Confirm publishing" confirmLabel={rollback ? "Yes, roll back" : `Yes, publish version ${version.version}`} busy={busy} error={error} onConfirm={() => decide("approve")} onCancel={cancel}>
              {rollback
                ? `New calls will go back to version ${version.version}. The current live version is kept in the history.`
                : `New calls will use version ${version.version} from now on. You can roll back at any time.`}
            </Confirm>
          ) : (
            <Confirm label="Confirm rejecting" tone="danger" confirmLabel={`Reject version ${version.version}`} busy={busy} error={error} onConfirm={() => decide("reject")} onCancel={cancel}>
              <Field label="Why are you rejecting it? (optional)">
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} rows={2} />
              </Field>
            </Confirm>
          ))}
      </div>
      )}
    </Panel>
  );
}

function Coach({ campaign, onDone }: { campaign: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CoachResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const outcome = await apiRequest(backendUrl(["campaigns", campaign, "coach"]), coachResultSchema, { method: "POST" });
      setResult(outcome);
      if (outcome.version !== null) onDone();
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-panel bg-rail px-5 py-4 text-rail-fg">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 max-w-2xl">
          <h2 className="t-section text-white">AI sales coach</h2>
          <p className="mt-1 text-[13px]">Reads this campaign&apos;s reviewed calls and proposes a new draft. Nothing goes live until you approve it. Prices, terms, proof points and compliance lines are never changed.</p>
        </div>
        <button type="button" onClick={run} disabled={busy} aria-busy={busy || undefined} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-control bg-signal px-3.5 text-[13.5px] font-semibold text-rail transition-opacity hover:opacity-90 disabled:opacity-60 max-sm:h-10">
          <Sparkles className={`size-3.5 ${busy ? "animate-pulse" : ""}`} aria-hidden="true" />
          {busy ? "Reviewing calls" : "Ask the coach for improvements"}
        </button>
      </div>
      {busy && <p className="mt-3 text-[12.5px]" role="status">This reads every reviewed call and can take a minute or two. You can stay on this page.</p>}
      {error && (
        <p className="mt-3 rounded-control bg-white/10 px-3 py-2 text-[13px] text-white" role="alert" data-testid="coach-error">
          The coach did not produce a draft: {error}
        </p>
      )}
      {result && (
        <p className="mt-3 rounded-control bg-white/10 px-3 py-2 text-[13px] text-white" role="status">
          {result.version === null
            ? `The coach read ${result.reviewed_calls} reviewed calls and found no repeating pattern that justifies a change. The playbook stays as it is.`
            : `Draft version ${result.version} was created from ${result.reviewed_calls} reviewed calls with ${result.changes.length} ${result.changes.length === 1 ? "recommendation" : "recommendations"}. Review it below; it is not live.`}
        </p>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="t-eyebrow">{title}</h2>
      {children}
    </div>
  );
}

export default function PlaybookPage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent(use(params).name);
  const { data, error, loading, reload } = useApi(backendUrl(["campaigns", name, "versions"]), versionListSchema);
  const [notice, setNotice] = useState<Notice>(null);
  const closeNotice = useCallback(() => setNotice(null), []);
  const changed = (n: Notice) => (setNotice(n), reload());

  const drafts = data?.filter((v) => v.status === "draft") ?? [];
  const live = data?.find((v) => v.status === "active");
  const history = data?.filter((v) => v.status === "archived" || v.status === "rejected") ?? [];

  return (
    <div className="space-y-6">
      <NoticeBar notice={notice} onClose={closeNotice} />
      <Coach campaign={name} onDone={reload} />

      {loading && !data ? (
        <Loading what="Loading playbook versions" strip={false} rows={4} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data && data.length === 0 ? (
        <EmptyState title="This campaign has no playbook yet">Create one on the calling engine first; its versions will appear here.</EmptyState>
      ) : data ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] [&>*]:min-w-0">
          <Group title="Waiting for your decision">
            {drafts.length === 0 ? (
              <p className="rounded-panel border border-dashed border-line-strong px-4 py-3.5 text-[13px] text-fg-2">No draft is waiting. Ask the coach above, or train the campaign from new documents, to get one.</p>
            ) : (
              drafts.map((v) => <VersionPanel key={v.version} campaign={name} version={v} onChanged={changed} />)
            )}
          </Group>
          <div className="space-y-6">
            {live && (
              <Group title="What calls use now">
                <VersionPanel key={live.version} campaign={name} version={live} onChanged={setNotice} />
              </Group>
            )}
            {history.length > 0 && (
              <Group title="History">
                {history.map((v) => (
                  <VersionPanel key={v.version} campaign={name} version={v} onChanged={changed} />
                ))}
              </Group>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
