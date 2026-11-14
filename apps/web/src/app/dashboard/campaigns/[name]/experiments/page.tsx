"use client";

import { use, useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { DASH, count, dateTime, percent } from "@/lib/api/format";
import { experimentListSchema, experimentSchema, versionListSchema, type Arm, type Experiment, type Version } from "@/lib/api/schemas";
import { Button, Confirm, DataTable, EmptyState, ErrorState, Field, Input, Loading, Meter, NoticeBar, Panel, Select, Status, Tag, type Column, type Notice, type Tone } from "@/components/dashboard/ui";
import { cn } from "@/lib/cn";

const VERDICT: Record<Experiment["verdict"], { text: string; tone: Tone }> = {
  collecting: { text: "Too early to compare", tone: "warn" },
  no_clear_difference: { text: "No clear difference", tone: "neutral" },
  variant_ahead: { text: "New version is ahead", tone: "pos" },
  control_ahead: { text: "Live version is ahead", tone: "info" },
};
const ENDED: Record<Experiment["status"], string> = { running: "Running", stopped: "Stopped, live version kept", promoted: "New version made live" };
const OPERATOR = "dashboard";
const failure = (error: unknown) => (error instanceof ApiError ? error.message : "Something went wrong. Try again.");

function ArmColumn({ side, arm, target, comparable, leading }: { side: "control" | "variant"; arm: Arm; target: number; comparable: boolean; leading: boolean }) {
  const title = side === "control" ? "Live version" : "New version";
  return (
    <div className={cn("p-4", side === "variant" && "border-line max-md:border-t md:border-l")} data-testid={`arm-${side}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="t-section text-fg">
          {title} <span className="t-figure text-[12.5px] font-normal text-fg-3">v{arm.version}</span>
        </p>
        {leading && <Tag tone="pos">Ahead</Tag>}
      </div>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="t-metric text-fg">{percent(arm.conversion_rate)}</span>
        <span className="t-meta">conversion rate</span>
      </p>
      {!comparable && arm.conversion_rate !== null && <p className="t-meta mt-0.5 text-warn">Sample too small to rely on</p>}
      <dl className="mt-3 divide-y divide-line border-y border-line text-[13px]">
        {[
          ["Leads dialed", count(arm.leads_dialed), undefined],
          ["Leads who answered", <span key="a">{count(arm.leads_answered)}<span className="font-sans font-normal tracking-normal text-fg-2 [font-family:var(--font-app)]"> of </span>{count(target)}<span className="font-normal tracking-normal text-fg-2 [font-family:var(--font-app)]"> needed</span></span>, "answered"],
          ["Conversions", count(arm.conversions), undefined],
          ["Call quality", arm.average_quality === null ? DASH : `${arm.average_quality} / 10`, undefined],
        ].map(([name, value, testId]) => (
          <div key={name as string} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-fg-3">{name}</dt>
            <dd className="t-figure font-medium text-fg" data-testid={testId as string | undefined}>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3">
        <Meter share={target > 0 ? arm.leads_answered / target : 0} tone={arm.answered_needed === 0 ? "pos" : "warn"} label={`${title} sample collected`} />
        <p className="t-meta mt-1">{arm.answered_needed === 0 ? "Enough answered leads." : `${count(arm.answered_needed)} more answered leads needed.`}</p>
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
      onChanged({ kind: "success", text: action === "stop" ? "The test was stopped. Calls keep using the live version." : `Version ${test.variant.version} is now live and the test has ended.` });
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title={test.name} description={`Started ${dateTime(test.started_at)} · ${percent(test.variant_share, 0)} of new leads hear the new version`} actions={<Status tone={verdict.tone}>{verdict.text}</Status>} flush>
      <p className="border-b border-line bg-paper px-4 py-3 text-[13.5px] text-fg" data-testid="test-summary">
        {test.summary}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <ArmColumn side="control" arm={test.control} target={test.min_answered_per_arm} comparable={test.enough_data} leading={test.leader === "control"} />
        <ArmColumn side="variant" arm={test.variant} target={test.min_answered_per_arm} comparable={test.enough_data} leading={test.leader === "variant"} />
      </div>
      <div className="border-t border-line p-4">
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
              <p className="t-meta mt-2 max-w-2xl">
                {test.verdict === "collecting"
                  ? "A version can be made live from this test only once both sides have enough answered leads and the new version is clearly ahead."
                  : "The results do not show the new version ahead, so it cannot be made live from this test. Stop the test to keep the live version."}
              </p>
            )}
          </>
        ) : (
          <Confirm
            label={confirm === "stop" ? "Confirm stopping" : "Confirm publishing"}
            tone={confirm === "stop" ? "danger" : "primary"}
            confirmLabel={confirm === "stop" ? "Yes, stop the test" : `Yes, make version ${test.variant.version} live`}
            busy={busy}
            error={error}
            onConfirm={() => end(confirm)}
            onCancel={() => (setConfirm(null), setError(null))}
          >
            {confirm === "stop"
              ? "Stopping ends the test for good. All leads go back to the live version, and the results so far are kept in the history."
              : `New calls will use version ${test.variant.version} from now on and the test ends. You can roll back on the Coach & playbook tab.`}
          </Confirm>
        )}
      </div>
    </Panel>
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
        <Link href={`/dashboard/campaigns/${encodeURIComponent(campaign)}/playbook`} className="font-medium text-accent hover:underline">
          Coach &amp; playbook
        </Link>{" "}
        tab first.
      </EmptyState>
    );
  }

  return (
    <Panel title="Start an A/B test" description="Leads not yet dialed are split at random between the live version and the one you choose. A lead stays on its side for every retry and callback. One test runs at a time.">
      <form onSubmit={submit} noValidate className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={`Version to test against ${liveVersion === null ? "the live one" : `live version ${liveVersion}`}`}>
          <Select value={variant} onChange={(e) => setVariant(e.target.value)} required>
            {candidates.map((v) => (
              <option key={v.version} value={v.version}>
                Version {v.version} ({v.status === "draft" ? "draft" : "earlier version"})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Share of new leads on the tested version">
          <Select value={share} onChange={(e) => setShare(e.target.value)}>
            {[10, 20, 30, 40, 50].map((n) => (
              <option key={n} value={n}>
                {n}%
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Answered leads needed on each side" hint="No side is called ahead before both reach this number. Minimum 30." error={error}>
          <Input type="number" inputMode="numeric" min={30} step={1} value={minimum} onChange={(e) => setMinimum(e.target.value)} required className="t-figure" />
        </Field>
        <Field label="Name (optional)">
          <Input type="text" maxLength={200} value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="e.g. Shorter opening" />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" busy={busy}>
            Start the test
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export default function ExperimentsPage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent(use(params).name);
  const tests = useApi(backendUrl(["campaigns", name, "experiments"]), experimentListSchema);
  const versions = useApi(backendUrl(["campaigns", name, "versions"]), versionListSchema);
  const [notice, setNotice] = useState<Notice>(null);
  const closeNotice = useCallback(() => setNotice(null), []);

  if ((tests.loading && !tests.data) || (versions.loading && !versions.data)) return <Loading what="Loading A/B tests" strip={false} rows={4} />;
  if (tests.error) return <ErrorState message={tests.error.message} onRetry={tests.reload} />;
  if (versions.error) return <ErrorState message={versions.error.message} onRetry={versions.reload} />;
  if (!tests.data || !versions.data) return null;

  const running = tests.data.find((t) => t.status === "running");
  const ended = tests.data.filter((t) => t.status !== "running");
  const live = versions.data.find((v) => v.status === "active")?.version ?? null;
  // A version with unanswered blocking questions cannot be put in front of prospects.
  const candidates = versions.data.filter((v) => (v.status === "draft" || v.status === "archived") && v.blocking_questions.length === 0);
  const changed = (n: Notice) => (setNotice(n), tests.reload(), versions.reload());

  const columns: Column<Experiment>[] = [
    {
      key: "name",
      label: "Test",
      primary: true,
      render: (t) => (
        <span className="block">
          <span className="font-medium text-fg">{t.name}</span>
          <span className="t-meta block">
            {dateTime(t.started_at)} to {dateTime(t.ended_at)}
          </span>
        </span>
      ),
    },
    { key: "outcome", label: "Outcome", render: (t) => ENDED[t.status] },
    {
      key: "control",
      label: "Live version",
      numeric: true,
      render: (t) => (
        <span>
          {percent(t.control.conversion_rate)} <span className="text-fg-3">· {count(t.control.leads_answered)} answered</span>
        </span>
      ),
    },
    {
      key: "variant",
      label: "Tested version",
      numeric: true,
      render: (t) => (
        <span>
          {percent(t.variant.conversion_rate)} <span className="text-fg-3">· {count(t.variant.leads_answered)} answered</span>
        </span>
      ),
    },
    { key: "verdict", label: "Result when it ended", render: (t) => <Status tone={VERDICT[t.verdict].tone}>{VERDICT[t.verdict].text}</Status> },
  ];

  return (
    <div className="space-y-5">
      <NoticeBar notice={notice} onClose={closeNotice} />
      {running ? <RunningTest campaign={name} test={running} onChanged={changed} /> : <StartForm campaign={name} candidates={candidates} liveVersion={live} onStarted={changed} />}
      {ended.length > 0 && (
        <Panel title="Earlier tests" description="Counted per lead. A lead who was called three times counts once." flush>
          <DataTable columns={columns} rows={ended} rowKey={(t) => t.id} caption="Earlier tests" />
        </Panel>
      )}
    </div>
  );
}
