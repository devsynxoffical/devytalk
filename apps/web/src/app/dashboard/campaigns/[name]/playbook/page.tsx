"use client";

import { use, useCallback, useState } from "react";
import { Lightbulb, Minus, Plus, Sparkles } from "lucide-react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { dateTime } from "@/lib/api/format";
import { coachResultSchema, versionDiffSchema, versionListSchema, versionSchema, type CoachResult, type Version } from "@/lib/api/schemas";
import { Button, Card, CardTitle, EmptyState, ErrorState, Loading, NoticeBar, Pill, type Notice, type Tone } from "@/components/dashboard/ui";

const STATUS: Record<Version["status"], { text: string; tone: Tone }> = {
  active: { text: "Live", tone: "green" },
  draft: { text: "Awaiting your approval", tone: "amber" },
  archived: { text: "Earlier version", tone: "gray" },
  rejected: { text: "Rejected", tone: "red" },
};

const SOURCES: Record<string, string> = {
  coach: "Proposed by the AI coach",
  training: "Built from your documents",
  onboarding: "Written during setup",
  import: "Imported",
  manual: "Edited by hand",
  existing: "In use before version history",
};

// The dashboard has no personal accounts yet, so approvals are recorded against the dashboard.
const APPROVER = "dashboard";

function failure(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Try again.";
}

function Diff({ campaign, version }: { campaign: string; version: number }) {
  const { data, error, loading, reload } = useApi(backendUrl(["campaigns", campaign, "versions", version, "diff"]), versionDiffSchema);
  if (loading && !data) return <Loading what="Comparing with the live version" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data) return null;
  if (data.changes.length === 0) return <p className="text-sm text-ink-500">This version says the same as the live one in every part that is compared.</p>;
  return (
    <div className="space-y-4" data-testid="version-diff">
      <p className="text-sm text-ink-500">
        Compared with {data.compared_with === null ? "the live playbook" : `version ${data.compared_with}, which is live`}.
      </p>
      {data.changes.map((change) => (
        <div key={change.field}>
          <p className="text-sm font-semibold text-ink-900">{change.label}</p>
          <ul className="mt-1.5 space-y-1">
            {change.removed.map((line) => (
              <li key={`r-${line}`} className="flex gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
                <Minus className="mt-0.5 size-4 shrink-0" aria-label="Removed" />
                <span className="break-words line-through decoration-red-300">{line}</span>
              </li>
            ))}
            {change.added.map((line) => (
              <li key={`a-${line}`} className="flex gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900">
                <Plus className="mt-0.5 size-4 shrink-0" aria-label="Added" />
                <span className="break-words">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

type Pending = "approve" | "reject" | null;

function VersionCard({ campaign, version, onChanged }: { campaign: string; version: Version; onChanged: (notice: Notice) => void }) {
  const [showDiff, setShowDiff] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const status = STATUS[version.status];
  const blocked = version.blocking_questions.length > 0;
  const rollback = version.status === "archived";

  async function decide(action: "approve" | "reject") {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(backendUrl(["campaigns", campaign, "versions", version.version, action]), versionSchema, {
        method: "POST",
        body: action === "approve" ? { approved_by: APPROVER } : { approved_by: APPROVER, reason: reason.trim() },
      });
      setPending(null);
      onChanged({
        kind: "success",
        text: action === "reject" ? `Version ${version.version} was rejected. Calls are unchanged.` : `Version ${version.version} is now live. New calls use it.`,
      });
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={version.status === "active" ? "border-brand-300" : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-3" data-testid={`version-${version.version}`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-ink-900">Version {version.version}</h3>
            <Pill tone={status.tone}>{status.text}</Pill>
          </div>
          <p className="mt-0.5 text-sm text-ink-500">
            {SOURCES[version.source] ?? version.source} · {dateTime(version.created_at)}
            {version.status === "active" && version.activated_at ? ` · live since ${dateTime(version.activated_at)}` : ""}
          </p>
        </div>
        {version.status !== "active" && (
          <Button onClick={() => setShowDiff((v) => !v)} aria-expanded={showDiff}>
            {showDiff ? "Hide changes" : "See what changes"}
          </Button>
        )}
      </div>

      {version.changes.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Recommendations and the evidence behind them</p>
          <ul className="mt-2 space-y-2">
            {version.changes.map((c) => (
              <li key={c.change} className="rounded-xl border border-ink-100 p-3 text-sm">
                <p className="flex gap-2 font-medium text-ink-900">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
                  {c.change}
                </p>
                <p className="mt-1 pl-6 text-ink-600">Evidence: {c.evidence}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {version.changes.length === 0 && version.note && <p className="mt-3 whitespace-pre-line text-sm text-ink-600">{version.note}</p>}

      {blocked && version.status !== "rejected" && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Questions that must be answered before this version can go live</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {version.blocking_questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {showDiff && (
        <div className="mt-4 border-t border-ink-100 pt-4">
          <Diff campaign={campaign} version={version.version} />
        </div>
      )}

      {(version.status === "draft" || rollback) && (
        <div className="mt-5 border-t border-ink-100 pt-4">
          {pending === null ? (
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
            <div role="group" aria-label="Confirm publishing">
              <p className="text-sm text-ink-800">
                {rollback
                  ? `New calls will go back to version ${version.version}. The current live version is kept in the history.`
                  : `New calls will use version ${version.version} from now on. You can roll back at any time.`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="primary" busy={busy} onClick={() => decide("approve")}>
                  {rollback ? "Yes, roll back" : `Yes, publish version ${version.version}`}
                </Button>
                <Button onClick={() => setPending(null)} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div role="group" aria-label="Confirm rejecting">
              <label className="block text-sm">
                <span className="font-medium text-ink-800">Why are you rejecting it? (optional)</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={1000}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="danger" busy={busy} onClick={() => decide("reject")}>
                  Reject version {version.version}
                </Button>
                <Button onClick={() => setPending(null)} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {error && (
            <p className="mt-3 text-sm font-medium text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

function CoachCard({ campaign, onDone }: { campaign: string; onDone: () => void }) {
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
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <CardTitle hint="The coach reads this campaign's reviewed calls and proposes a new draft. Nothing goes live until you approve it. Prices, terms, proof points and compliance lines are never changed.">
          AI sales coach
        </CardTitle>
        <Button variant="primary" busy={busy} onClick={run}>
          {!busy && <Sparkles className="size-4" aria-hidden="true" />}
          {busy ? "Reviewing calls" : "Ask the coach for improvements"}
        </Button>
      </div>
      {busy && (
        <p className="text-sm text-ink-500" role="status">
          This reads every reviewed call and can take a minute or two. You can stay on this page.
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert" data-testid="coach-error">
          The coach did not produce a draft: {error}
        </p>
      )}
      {result && result.version === null && (
        <p className="rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-700" role="status">
          The coach read {result.reviewed_calls} reviewed calls and found no repeating pattern that justifies a change. The playbook stays as it is.
        </p>
      )}
      {result && result.version !== null && (
        <p className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900" role="status">
          Draft version {result.version} was created from {result.reviewed_calls} reviewed calls with {result.changes.length}{" "}
          {result.changes.length === 1 ? "recommendation" : "recommendations"}. Review it below; it is not live.
        </p>
      )}
    </Card>
  );
}

export default function PlaybookPage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent(use(params).name);
  const { data, error, loading, reload } = useApi(backendUrl(["campaigns", name, "versions"]), versionListSchema);
  const [notice, setNotice] = useState<Notice>(null);
  const closeNotice = useCallback(() => setNotice(null), []);

  const drafts = data?.filter((v) => v.status === "draft") ?? [];
  const live = data?.find((v) => v.status === "active");
  const history = data?.filter((v) => v.status === "archived" || v.status === "rejected") ?? [];

  return (
    <div className="space-y-6">
      <NoticeBar notice={notice} onClose={closeNotice} />
      <CoachCard campaign={name} onDone={reload} />

      {loading && !data ? (
        <Loading what="Loading playbook versions" />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data && data.length === 0 ? (
        <EmptyState title="This campaign has no playbook yet">Create one on the calling engine first; its versions will appear here.</EmptyState>
      ) : data ? (
        <>
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-ink-900">Waiting for your decision</h2>
            {drafts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-ink-200 bg-white px-5 py-4 text-sm text-ink-500">
                No draft is waiting. Ask the coach above, or train the campaign from new documents, to get one.
              </p>
            ) : (
              drafts.map((v) => (
                <VersionCard
                  key={v.version}
                  campaign={name}
                  version={v}
                  onChanged={(n) => {
                    setNotice(n);
                    reload();
                  }}
                />
              ))
            )}
          </section>

          {live && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-ink-900">What calls use now</h2>
              <VersionCard key={live.version} campaign={name} version={live} onChanged={setNotice} />
            </section>
          )}

          {history.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-ink-900">History</h2>
              {history.map((v) => (
                <VersionCard
                  key={v.version}
                  campaign={name}
                  version={v}
                  onChanged={(n) => {
                    setNotice(n);
                    reload();
                  }}
                />
              ))}
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}
