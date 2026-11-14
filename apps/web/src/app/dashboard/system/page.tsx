"use client";

import { useCallback, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { count, dateTime } from "@/lib/api/format";
import { jobsSchema, okSchema, type Job } from "@/lib/api/schemas";
import { Button, DataTable, EmptyState, ErrorState, Loading, Metric, MetricStrip, NoticeBar, PageHeader, Panel, Segmented, Status, type Column, type Notice, type Tone } from "@/components/dashboard/ui";

const KIND: Record<string, string> = { booking_webhook: "Booking notification", call_review: "Call review", training_run: "Training run" };
const STATE: Record<Job["status"], { text: string; tone: Tone }> = {
  queued: { text: "Waiting", tone: "info" },
  running: { text: "Running", tone: "warn" },
  done: { text: "Done", tone: "pos" },
  dead: { text: "Gave up", tone: "crit" },
};
type Filter = "" | Job["status"];

export default function SystemPage() {
  const [filter, setFilter] = useState<Filter>("");
  const { data, error, loading, reload } = useApi(backendUrl(["jobs"], { status: filter, limit: 50 }), jobsSchema);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const closeNotice = useCallback(() => setNotice(null), []);

  async function retry(job: Job) {
    setBusy(job.id);
    try {
      await apiRequest(backendUrl(["jobs", job.id, "retry"]), okSchema, { method: "POST" });
      setNotice({ kind: "success", text: `${KIND[job.kind] ?? job.kind} was queued to run again.` });
      reload();
    } catch (e) {
      setNotice({ kind: "error", text: e instanceof ApiError ? e.message : "Something went wrong. Try again." });
    } finally {
      setBusy(null);
    }
  }

  const columns: Column<Job>[] = [
    {
      key: "kind",
      label: "Work",
      primary: true,
      render: (job) => (
        <span className="block">
          <span className="font-medium text-fg">{KIND[job.kind] ?? job.kind}</span>
          {job.call_run_id !== null && <span className="t-meta block">Call <span className="t-figure">{job.call_run_id}</span></span>}
        </span>
      ),
    },
    { key: "state", label: "State", render: (job) => <Status tone={STATE[job.status].tone}>{STATE[job.status].text}</Status> },
    { key: "attempts", label: "Attempts", numeric: true, render: (job) => `${job.attempts} of ${job.max_attempts}` },
    { key: "created", label: "Created", render: (job) => dateTime(job.created_at) },
    { key: "error", label: "Last problem", render: (job) => (job.last_error ? <span className="break-words text-fg-2">{job.last_error}</span> : null), className: "sm:max-w-96" },
    {
      key: "action",
      label: "",
      render: (job) =>
        job.status === "dead" ? (
          <Button size="sm" busy={busy === job.id} onClick={() => retry(job)}>
            {busy !== job.id && <RotateCcw className="size-3.5" aria-hidden="true" />} Run again
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader title="Background work" description="What the engine does after or beside a call: reviewing calls, telling your systems about booked meetings, training from documents. Failed work is retried on its own; what gave up for good is listed with the reason." />
      <div className="mt-5 space-y-5">
        <NoticeBar notice={notice} onClose={closeNotice} />
        {loading && !data ? (
          <Loading what="Loading background work" />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : data ? (
          <>
            <MetricStrip>
              <Metric label="Waiting" value={count(data.stats.queued)} note={data.stats.oldest_due_seconds > 60 ? `Oldest is ${Math.round(data.stats.oldest_due_seconds / 60)} min late` : "None overdue"} />
              <Metric label="Running" value={count(data.stats.running)} />
              <Metric label="Done" value={count(data.stats.done)} />
              <Metric label="Gave up" value={count(data.stats.dead)} note={data.stats.dead > 0 ? <Status tone="crit">Needs a look</Status> : "Nothing failed for good"} />
            </MetricStrip>
            <Panel
              title="Recent work"
              description="Newest first"
              actions={<Segmented label="Show work" value={filter} onChange={setFilter} options={[["", "All"], ["dead", "Gave up"], ["queued", "Waiting"], ["running", "Running"], ["done", "Done"]]} />}
              flush
            >
              {data.jobs.length === 0 ? (
                <div className="p-4">
                  <EmptyState title={filter ? "Nothing in this state" : "No background work yet"}>Work appears here once calls end, meetings are booked or training is started.</EmptyState>
                </div>
              ) : (
                <DataTable columns={columns} rows={data.jobs} rowKey={(job) => job.id} caption="Background work" />
              )}
            </Panel>
          </>
        ) : null}
      </div>
    </>
  );
}
