"use client";

import { use, useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { DASH, count, dateTime, percent } from "@/lib/api/format";
import { experimentListSchema, experimentSchema, versionListSchema, type Arm, type Experiment, type Version } from "@/lib/api/schemas";
import { Button, Card, CardTitle, EmptyState, ErrorState, Loading, Meter, NoticeBar, Pill, TableWrap, Td, Th, type Notice, type Tone } from "@/components/dashboard/ui";

const VERDICT: Record<Experiment["verdict"], { text: string; tone: Tone }> = {
  collecting: { text: "Too early to compare", tone: "amber" },
  no_clear_difference: { text: "No clear difference", tone: "gray" },
  variant_ahead: { text: "New version is ahead", tone: "green" },
  control_ahead: { text: "Live version is ahead", tone: "blue" },
};
const ENDED: Record<Experiment["status"], string> = { running: "Running", stopped: "Stopped, live version kept", promoted: "New version made live" };
const inputClass = "h-9 w-full rounded-lg border border-ink-200 bg-white px-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";
const OPERATOR = "dashboard";

function failure(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Try again.";
}

function ArmColumn({ title, arm, target, comparable, leading }: { title: string; arm: Arm; target: number; comparable: boolean; leading: boolean }) {
  return (
    <div className="rounded-xl border border-ink-100 p-4" data-testid={`arm-${title.startsWith("Live") ? "control" : "variant"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-ink-900">
          {title} <span className="font-normal text-ink-500">· version {arm.version}</span>
        </p>
        {leading && <Pill tone="green">Ahead</Pill>}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-ink-500">Leads dialed</dt>
        <dd className="text-right font-medium tabular-nums text-ink-900">{count(arm.leads_dialed)}</dd>
        <dt className="text-ink-500">Leads who answered</dt>
        <dd className="text-right font-medium tabular-nums text-ink-900" data-testid="answered">
          {count(arm.leads_answered)} of {count(target)} needed
        </dd>
        <dt className="text-ink-500">Conversions</dt>
        <dd className="text-right font-medium tabular-nums text-ink-900">{count(arm.conversions)}</dd>
        <dt className="text-ink-500">Conversion rate</dt>
        <dd className="text-right font-medium tabular-nums text-ink-900">
          {percent(arm.conversion_rate)}
          {!comparable && arm.conversion_rate !== null && <span className="block text-xs font-normal text-ink-500">sample too small to rely on</span>}
        </dd>
        <dt className="text-ink-500">Call quality</dt>
        <dd className="text-right font-medium tabular-nums text-ink-900">{arm.average_quality === null ? DASH : `${arm.average_quality} / 10`}</dd>
      </dl>
      <div className="mt-3">
        <Meter share={target > 0 ? arm.leads_answered / target : 0} tone={arm.answered_needed === 0 ? "green" : "amber"} label={`${title} sample collected`} />
        <p className="mt-1 text-xs text-ink-500">
          {arm.answered_needed === 0 ? "Enough answered leads." : `${count(arm.answered_needed)} more answered leads needed.`}
        </p>
      </div>
    </div>
  );
}

function RunningTest({ campaign, test, onChanged }: { campaign: string; test: Experiment; onChanged: (notice: Notice) => void }) {
  const [confirm, setConfirm] = useState<"stop" | "promote" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verdict = VERDICT[test.verdict];
  const canPromote = test.verdict === "variant_ahead";

  async function end(action: "stop" | "promote") {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(backendUrl(["campaigns", campaign, "experiments", test.id, action]), experimentSchema, { method: "POST", body: { by: OPERATOR } });
      setConfirm(null);
      onChanged({
        kind: "success",
        text: action === "stop" ? "The test was stopped. Calls keep using the live version." : `Version ${test.variant.version} is now live and the test has ended.`,
      });
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <CardTitle hint={`Started ${dateTime(test.started_at)} · ${percent(test.variant_share, 0)} of new leads hear the new version`}>{test.name}</CardTitle>
        <Pill tone={verdict.tone}>{verdict.text}</Pill>
      </div>
      <p className="rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-800" data-testid="test-summary">
        {test.summary}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ArmColumn title="Live version" arm={test.control} target={test.min_answered_per_arm} comparable={test.enough_data} leading={test.leader === "control"} />
        <ArmColumn title="New version" arm={test.variant} target={test.min_answered_per_arm} comparable={test.enough_data} leading={test.leader === "variant"} />
      </div>

      <div className="mt-5 border-t border-ink-100 pt-4">
        {confirm === null ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" disabled={!canPromote} onClick={() => setConfirm("promote")}>
                Make version {test.variant.version} live
              </Button>
              <Button variant="danger" onClick={() => setConfirm("stop")}>
                Stop the test
              </Button>
            </div>
            {!canPromote && (
              <p className="mt-2 text-sm text-ink-500">
                {test.verdict === "collecting"
                  ? "A version can be made live from this test only once both sides have enough answered leads and the new version is clearly ahead."
                  : "The results do not show the new version ahead, so it cannot be made live from this test. Stop the test to keep the live version."}
              </p>
            )}
          </>
        ) : (
          <div role="group" aria-label={confirm === "stop" ? "Confirm stopping" : "Confirm publishing"}>
            <p className="text-sm text-ink-800">
              {confirm === "stop"
                ? "Stopping ends the test for good. All leads go back to the live version, and the results so far are kept in the history."
                : `New calls will use version ${test.variant.version} from now on and the test ends. You can roll back on the Coach & playbook tab.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant={confirm === "stop" ? "danger" : "primary"} busy={busy} onClick={() => end(confirm)}>
                {confirm === "stop" ? "Yes, stop the test" : `Yes, make version ${test.variant.version} live`}
              </Button>
              <Button onClick={() => setConfirm(null)} disabled={busy}>
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
    </Card>
  );
}

function StartForm({ campaign, candidates, liveVersion, onStarted }: { campaign: string; candidates: Version[]; liveVersion: number | null; onStarted: (notice: Notice) => void }) {
  const [variant, setVariant] = useState(String(candidates[0]?.version ?? ""));
  const [share, setShare] = useState("50");
  const [minimum, setMinimum] = useState("50");
  const [testName, setTestName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const min = Number(minimum);
    if (!Number.isInteger(min) || min < 30) {
      setError("Each side needs at least 30 answered leads before it can be judged.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const started = await apiRequest(backendUrl(["campaigns", campaign, "experiments"]), experimentSchema, {
        method: "POST",
        body: { variant_version: Number(variant), name: testName.trim(), variant_share: Number(share) / 100, min_answered_per_arm: min, started_by: OPERATOR },
      });
      onStarted({ kind: "success", text: `“${started.name}” is running. Leads not yet dialed are now split between the two versions.` });
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  if (candidates.length === 0) {
    return (
      <EmptyState title="No version to test yet">
        A test compares the live playbook with another version. Ask the coach for a draft on the{" "}
        <Link href={`/dashboard/campaigns/${encodeURIComponent(campaign)}/playbook`} className="font-semibold text-brand-700 hover:underline">
          Coach &amp; playbook
        </Link>{" "}
        tab first.
      </EmptyState>
    );
  }

  return (
    <Card>
      <CardTitle hint="Leads that have not been dialed yet are split at random between the live version and the version you choose. A lead stays on its side for every retry and callback. Only one test can run at a time.">
        Start an A/B test
      </CardTitle>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-800">Version to test against {liveVersion === null ? "the live one" : `live version ${liveVersion}`}</span>
          <select value={variant} onChange={(e) => setVariant(e.target.value)} className={inputClass} required>
            {candidates.map((v) => (
              <option key={v.version} value={v.version}>
                Version {v.version} ({v.status === "draft" ? "draft" : "earlier version"})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-800">Share of new leads on the tested version</span>
          <select value={share} onChange={(e) => setShare(e.target.value)} className={inputClass}>
            {[10, 20, 30, 40, 50].map((n) => (
              <option key={n} value={n}>
                {n}%
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-800">Answered leads needed on each side</span>
          <input type="number" min={30} step={1} value={minimum} onChange={(e) => setMinimum(e.target.value)} className={inputClass} required />
          <span className="mt-1 block text-xs text-ink-500">No side is called ahead before both reach this number. Minimum 30.</span>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-800">Name (optional)</span>
          <input type="text" maxLength={200} value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="e.g. Shorter opening" className={inputClass} />
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" busy={busy}>
            Start the test
          </Button>
          {error && (
            <p className="mt-3 text-sm font-medium text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}

export default function ExperimentsPage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent(use(params).name);
  const tests = useApi(backendUrl(["campaigns", name, "experiments"]), experimentListSchema);
  const versions = useApi(backendUrl(["campaigns", name, "versions"]), versionListSchema);
  const [notice, setNotice] = useState<Notice>(null);
  const closeNotice = useCallback(() => setNotice(null), []);

  if ((tests.loading && !tests.data) || (versions.loading && !versions.data)) return <Loading what="Loading A/B tests" />;
  if (tests.error) return <ErrorState message={tests.error.message} onRetry={tests.reload} />;
  if (versions.error) return <ErrorState message={versions.error.message} onRetry={versions.reload} />;
  if (!tests.data || !versions.data) return null;

  const running = tests.data.find((t) => t.status === "running");
  const ended = tests.data.filter((t) => t.status !== "running");
  const live = versions.data.find((v) => v.status === "active")?.version ?? null;
  // A version with unanswered blocking questions cannot be put in front of prospects.
  const candidates = versions.data.filter((v) => (v.status === "draft" || v.status === "archived") && v.blocking_questions.length === 0);
  const changed = (n: Notice) => {
    setNotice(n);
    tests.reload();
    versions.reload();
  };

  return (
    <div className="space-y-6">
      <NoticeBar notice={notice} onClose={closeNotice} />
      {running ? <RunningTest campaign={name} test={running} onChanged={changed} /> : <StartForm campaign={name} candidates={candidates} liveVersion={live} onStarted={changed} />}

      {ended.length > 0 && (
        <Card>
          <CardTitle hint="Counted per lead. A lead who was called three times counts once.">Earlier tests</CardTitle>
          <TableWrap>
            <thead className="bg-ink-50">
              <tr>
                <Th>Test</Th>
                <Th>Outcome</Th>
                <Th className="text-right">Live version</Th>
                <Th className="text-right">Tested version</Th>
                <Th>Result when it ended</Th>
              </tr>
            </thead>
            <tbody>
              {ended.map((t) => (
                <tr key={t.id} className="border-t border-ink-100">
                  <Td>
                    <span className="font-semibold text-ink-900">{t.name}</span>
                    <span className="block text-xs text-ink-500">
                      {dateTime(t.started_at)} to {dateTime(t.ended_at)}
                    </span>
                  </Td>
                  <Td>{ENDED[t.status]}</Td>
                  <Td className="text-right tabular-nums">
                    {percent(t.control.conversion_rate)}
                    <span className="block text-xs text-ink-500">{count(t.control.leads_answered)} answered</span>
                  </Td>
                  <Td className="text-right tabular-nums">
                    {percent(t.variant.conversion_rate)}
                    <span className="block text-xs text-ink-500">{count(t.variant.leads_answered)} answered</span>
                  </Td>
                  <Td>
                    <Pill tone={VERDICT[t.verdict].tone}>{VERDICT[t.verdict].text}</Pill>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      )}
    </div>
  );
}
