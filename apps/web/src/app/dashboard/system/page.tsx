"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, CircleAlert, RotateCcw } from "lucide-react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { count, dateTime } from "@/lib/api/format";
import { jobsSchema, okSchema, type Job } from "@/lib/api/schemas";
import { Button, EmptyState, ErrorState, Loading, NoticeBar, Pill, TableWrap, Td, Th, type Notice, type Tone } from "@/components/dashboard/ui";
import { Panel, StatTile } from "@/components/dashboard/viz";

const KIND: Record<string, string> = { booking_webhook: "Booking notification", call_review: "Call review", training_run: "Training run" };
const STATE: Record<Job["status"], { text: string; tone: Tone }> = {
  queued: { text: "Waiting", tone: "blue" },
  running: { text: "Running", tone: "amber" },
  done: { text: "Done", tone: "green" },
  dead: { text: "Gave up", tone: "red" },
};

export default function SystemPage() {
  const [filter, setFilter] = useState<"" | Job["status"]>("");
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

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Background work</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-500">
        Work the engine does after or beside a call: reviewing calls, telling your systems about booked meetings, training from documents. Failed work is retried on its own; what gave up for good is listed here with the reason.
      </p>

      <div className="mt-6 space-y-5">
        <NoticeBar notice={notice} onClose={closeNotice} />
        {loading && !data ? (
          <Loading what="Loading background work" />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile label="Waiting" value={count(data.stats.queued)} note={data.stats.oldest_due_seconds > 60 ? `Oldest is ${Math.round(data.stats.oldest_due_seconds / 60)} min late` : "None overdue"} />
              <StatTile label="Running" value={count(data.stats.running)} />
              <StatTile label="Done" value={count(data.stats.done)} />
              <StatTile
                label="Gave up"
                value={count(data.stats.dead)}
                note={
                  data.stats.dead > 0 ? (
                    <span className="inline-flex items-center gap-1 text-red-700">
                      <CircleAlert className="size-3.5" aria-hidden="true" /> Needs a look
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3.5 text-brand-600" aria-hidden="true" /> Nothing failed for good
                    </span>
                  )
                }
              />
            </div>

            <Panel
              title="Recent work"
              hint="Newest first"
              action={
                <label className="text-xs text-ink-500">
                  <span className="sr-only">Show</span>
                  <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="h-8 rounded-lg border border-ink-200 bg-white px-2 text-sm text-ink-900">
                    <option value="">All</option>
                    <option value="dead">Gave up</option>
                    <option value="queued">Waiting</option>
                    <option value="running">Running</option>
                    <option value="done">Done</option>
                  </select>
                </label>
              }
            >
              {data.jobs.length === 0 ? (
                <EmptyState title={filter ? "Nothing in this state" : "No background work yet"}>Work appears here once calls end, meetings are booked or training is started.</EmptyState>
              ) : (
                <TableWrap>
                  <thead className="bg-ink-50">
                    <tr>
                      <Th>Work</Th>
                      <Th>State</Th>
                      <Th className="text-right">Attempts</Th>
                      <Th>Created</Th>
                      <Th>Last problem</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.jobs.map((job) => (
                      <tr key={job.id} className="border-t border-ink-100">
                        <Td>
                          <span className="font-semibold text-ink-900">{KIND[job.kind] ?? job.kind}</span>
                          {job.call_run_id !== null && <span className="block text-xs text-ink-500">Call {job.call_run_id}</span>}
                        </Td>
                        <Td>
                          <Pill tone={STATE[job.status].tone}>{STATE[job.status].text}</Pill>
                        </Td>
                        <Td className="text-right tabular-nums">
                          {job.attempts} of {job.max_attempts}
                        </Td>
                        <Td>{dateTime(job.created_at)}</Td>
                        <Td className="max-w-sm break-words text-ink-600">{job.last_error ?? ""}</Td>
                        <Td>
                          {job.status === "dead" && (
                            <Button busy={busy === job.id} onClick={() => retry(job)}>
                              {busy !== job.id && <RotateCcw className="size-4" aria-hidden="true" />} Run again
                            </Button>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              )}
            </Panel>
          </>
        ) : null}
      </div>
    </>
  );
}
