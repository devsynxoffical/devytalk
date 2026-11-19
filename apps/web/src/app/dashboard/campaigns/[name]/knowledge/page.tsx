"use client";

import { use, useCallback, useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import { FileText, Globe, Search, Trash2, Upload } from "lucide-react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { count, dateTime, fileSize, languageName } from "@/lib/api/format";
import { documentListSchema, documentSchema, knowledgeSearchSchema, okSchema, trainingRunSchema, type KnowledgeSearch, type TrainingDocument } from "@/lib/api/schemas";
import { Banner, Button, Confirm, DataTable, EmptyState, ErrorState, Field, Input, Loading, NoticeBar, Panel, Select, Status, type Column, type Notice, type Tone } from "@/components/dashboard/ui";
import { cn } from "@/lib/cn";
import { useAccess } from "@/components/dashboard/access";

const ACCEPTED = [".pdf", ".docx", ".pptx", ".html", ".htm", ".csv", ".txt", ".md"];
const MAX_BYTES = 25 * 1024 * 1024;
const failure = (error: unknown) => (error instanceof ApiError ? error.message : "Something went wrong. Try again.");
const reading = (d: TrainingDocument) => d.status === "pending" || d.status === "processing";

const STATE: Record<string, { text: string; tone: Tone; live?: boolean }> = {
  pending: { text: "Waiting to be read", tone: "info" },
  processing: { text: "Reading", tone: "info", live: true },
  ready: { text: "Ready", tone: "pos" },
  failed: { text: "Could not be read", tone: "crit" },
};

/** Why a file cannot be sent, before it is sent. The engine checks again. */
export function uploadProblem(file: { name: string; size: number }): string | null {
  const dot = file.name.lastIndexOf(".");
  const suffix = dot < 0 ? "" : file.name.slice(dot).toLowerCase();
  if (!ACCEPTED.includes(suffix)) return `${file.name}: this file type is not supported. Use PDF, Word, PowerPoint, HTML, CSV or text.`;
  if (file.size > MAX_BYTES) return `${file.name}: the file is larger than 25 MB.`;
  if (file.size === 0) return `${file.name}: the file is empty.`;
  return null;
}

function AddSources({ campaign, onAdded }: { campaign: string; onAdded: (notice: Notice) => void }) {
  const picker = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [pages, setPages] = useState("8");
  const [adding, setAdding] = useState(false);
  const [siteError, setSiteError] = useState<string | null>(null);

  async function send(files: File[]) {
    const problems: string[] = [];
    let sent = 0;
    for (const file of files) {
      const problem = uploadProblem(file);
      if (problem) {
        problems.push(problem);
        continue;
      }
      setSending(file.name);
      const form = new FormData();
      form.append("file", file);
      try {
        await apiRequest(backendUrl(["campaigns", campaign, "documents"]), documentSchema, { form });
        sent += 1;
      } catch (e) {
        problems.push(`${file.name}: ${failure(e)}`);
      }
    }
    setSending(null);
    if (problems.length) onAdded({ kind: "error", text: problems.join(" ") });
    else if (sent) onAdded({ kind: "success", text: sent === 1 ? "The document was uploaded and is being read." : `${sent} documents were uploaded and are being read.` });
    else onAdded(null);
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    if (!sending) void send([...event.dataTransfer.files]);
  }

  async function addSite(event: FormEvent) {
    event.preventDefault();
    const address = url.trim();
    if (!/^https?:\/\/\S+\.\S+/i.test(address)) {
      setSiteError("Enter a full web address that starts with https://");
      return;
    }
    setAdding(true);
    setSiteError(null);
    try {
      await apiRequest(backendUrl(["campaigns", campaign, "sources"]), documentSchema, { method: "POST", body: { url: address, max_pages: Number(pages) } });
      setUrl("");
      onAdded({ kind: "success", text: "The website was added and is being read." });
    } catch (e) {
      setSiteError(failure(e));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
      <div
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
        className={cn("flex flex-col items-center justify-center rounded-panel border border-dashed px-4 py-6 text-center transition-colors", over ? "border-accent bg-info-bg" : "border-line-strong bg-surface")}
      >
        <Upload className="size-5 text-fg-3" aria-hidden="true" />
        <p className="mt-2 text-[13.5px] font-medium text-fg">Upload documents</p>
        <p className="t-meta mt-0.5">PDF, Word, PowerPoint, HTML, CSV or text, up to 25 MB each. Drop files here or choose them.</p>
        <input ref={picker} type="file" multiple accept={ACCEPTED.join(",")} className="sr-only" aria-label="Choose documents to upload" onChange={(e) => (void send([...(e.target.files ?? [])]), (e.target.value = ""))} />
        <Button className="mt-3" busy={sending !== null} onClick={() => picker.current?.click()}>
          {sending ? "Uploading" : "Choose files"}
        </Button>
        {sending && (
          <p className="t-meta mt-2" role="status">
            Uploading {sending}
          </p>
        )}
      </div>

      <form onSubmit={addSite} className="rounded-panel border border-line bg-surface p-4" noValidate>
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-fg-3" aria-hidden="true" />
          <p className="text-[13.5px] font-medium text-fg">Learn from a website</p>
        </div>
        <p className="t-meta mt-0.5">Reads the page you give and pages it links to on the same site.</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <Field label="Web address" error={siteError} className="min-w-48 flex-1">
            <Input type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/pricing" autoComplete="off" />
          </Field>
          <Field label="Pages to read" className="w-28">
            <Select value={pages} onChange={(e) => setPages(e.target.value)}>
              {[1, 3, 8, 15, 25].map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? "This page" : `Up to ${n}`}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" variant="primary" busy={adding}>
            Add website
          </Button>
        </div>
      </form>
    </div>
  );
}

function Sources({ campaign, documents, onChanged }: { campaign: string; documents: TrainingDocument[]; onChanged: (notice: Notice) => void }) {
  const { canOperate } = useAccess();
  const [removing, setRemoving] = useState<TrainingDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(document: TrainingDocument) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(backendUrl(["campaigns", campaign, "documents", document.id]), okSchema.nullable(), { method: "DELETE" });
      setRemoving(null);
      onChanged({ kind: "success", text: `${document.name} was removed. The agent no longer uses it.` });
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  const passages = documents.filter((d) => d.status === "ready").reduce((n, d) => n + d.passages, 0);
  const state = (d: TrainingDocument) => STATE[d.status] ?? { text: d.status, tone: "neutral" as Tone };
  const columns: Column<TrainingDocument>[] = [
    {
      key: "name",
      label: "Source",
      primary: true,
      sortValue: (d) => d.name.toLowerCase(),
      render: (d) => (
        <span className="flex min-w-0 items-start gap-2">
          {d.kind === "url" ? <Globe className="mt-0.5 size-3.5 shrink-0 text-fg-3" aria-hidden="true" /> : <FileText className="mt-0.5 size-3.5 shrink-0 text-fg-3" aria-hidden="true" />}
          <span className="min-w-0">
            <span className="block break-words font-medium text-fg">{d.name}</span>
            {d.status === "failed" && d.error && <span className="mt-0.5 block text-[12.5px] text-crit">{d.error}</span>}
            {d.version > 1 && <span className="t-meta block">Version {d.version} of this file</span>}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      label: "State",
      sortValue: (d) => d.status,
      render: (d) => (
        <Status tone={state(d).tone} live={state(d).live}>
          {state(d).text}
        </Status>
      ),
    },
    { key: "passages", label: "Passages", numeric: true, sortValue: (d) => d.passages, render: (d) => (d.status === "ready" ? count(d.passages) : "–") },
    { key: "language", label: "Language", render: (d) => (d.language ? languageName(d.language) : "–") },
    { key: "size", label: "Size", numeric: true, sortValue: (d) => d.size_bytes, render: (d) => (d.kind === "url" ? "–" : fileSize(d.size_bytes)) },
    { key: "added", label: "Added", sortValue: (d) => d.uploaded_at ?? "", render: (d) => <span className="text-fg-2">{dateTime(d.uploaded_at)}</span> },
    ...(canOperate
      ? [
          {
            key: "remove",
            label: "",
            render: (d) => (
              <Button variant="ghost" size="sm" aria-label={`Remove ${d.name}`} onClick={() => (setError(null), setRemoving(d))}>
                <Trash2 className="size-3.5" aria-hidden="true" />
                <span className="sm:sr-only">Remove</span>
              </Button>
            ),
          } satisfies Column<TrainingDocument>,
        ]
      : []),
  ];

  return (
    <Panel title="Sources" description={`${count(documents.length)} ${documents.length === 1 ? "source" : "sources"} · ${count(passages)} ${passages === 1 ? "passage" : "passages"} the agent can look up`} flush>
      {removing && (
        <div className="border-b border-line p-3">
          <Confirm label={`Remove ${removing.name}`} confirmLabel="Remove source" tone="danger" busy={busy} error={error} onConfirm={() => remove(removing)} onCancel={() => setRemoving(null)}>
            Remove <strong className="font-semibold text-fg">{removing.name}</strong>? The agent stops using what it learned from it on the next call. Playbook versions already built from it are not changed.
          </Confirm>
        </div>
      )}
      <DataTable columns={columns} rows={documents} rowKey={(d) => d.id} caption="Training sources" initialSort={{ key: "added", descending: true }} testId="sources" />
    </Panel>
  );
}

function KnowledgeTest({ campaign }: { campaign: string }) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<{ question: string; found: KnowledgeSearch } | null>(null);

  async function search(event: FormEvent) {
    event.preventDefault();
    const q = question.trim();
    if (!q) return;
    setBusy(true);
    setError(null);
    try {
      setAnswer({ question: q, found: await apiRequest(backendUrl(["campaigns", campaign, "knowledge", "search"], { q, limit: 5 }), knowledgeSearchSchema) });
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Test what the agent knows" description="Ask a question a prospect might ask. These are the passages the agent would find during a call.">
      <form onSubmit={search} className="flex flex-wrap items-end gap-3">
        <Field label="Prospect question" className="min-w-48 flex-1" error={error}>
          <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="How much does the Growth plan cost?" maxLength={300} />
        </Field>
        <Button type="submit" variant="primary" busy={busy} disabled={!question.trim()}>
          <Search className="size-3.5" aria-hidden="true" />
          Find passages
        </Button>
      </form>
      {answer && (
        <div className="mt-4" role="status" data-testid="knowledge-results">
          {answer.found.passages_indexed === 0 ? (
            <p className="text-[13px] text-fg-2">Nothing is indexed yet. Add a document or a website first.</p>
          ) : answer.found.results.length === 0 ? (
            <p className="text-[13px] text-fg-2">
              Nothing in {count(answer.found.passages_indexed)} passages matches “{answer.question}”. On a call the agent would say it does not have that information instead of guessing.
            </p>
          ) : (
            <>
              <p className="t-meta">
                {answer.found.results.length} of {count(answer.found.passages_indexed)} passages, best match first
              </p>
              <ol className="mt-2 divide-y divide-line border-y border-line">
                {answer.found.results.map((hit, i) => (
                  <li key={i} className="flex gap-3 py-3">
                    <span className="t-figure w-5 shrink-0 text-fg-3">{i + 1}</span>
                    <div className="min-w-0">
                      <p dir="auto" className="text-[13.5px] leading-relaxed break-words text-fg">
                        {hit.text}
                      </p>
                      <p className="t-meta mt-1 break-words">From {hit.source}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </Panel>
  );
}

function Training({ campaign, documents }: { campaign: string; documents: TrainingDocument[] }) {
  const run = useApi(backendUrl(["campaigns", campaign, "train"]), trainingRunSchema);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = run.data;
  const running = latest?.status === "running";
  const reload = run.reload;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(reload, 4000);
    return () => clearInterval(timer);
  }, [running, reload]);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(backendUrl(["campaigns", campaign, "train"]), trainingRunSchema, { method: "POST" });
      setAsking(false);
      reload();
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  const { canOperate } = useAccess();
  const ready = documents.filter((d) => d.status === "ready").length;
  const stillReading = documents.filter(reading).length;
  const playbook = `/dashboard/campaigns/${encodeURIComponent(campaign)}/playbook`;
  return (
    <Panel title="Build a playbook from these sources" description="Writes a new draft playbook from the campaign's script and every ready source. Calls keep using the live version until you approve the draft.">
      {latest && (
        <div className="mb-4" data-testid="training-run">
          {running ? (
            <Banner tone="info" title="Building a draft" role="status">
              Started {dateTime(latest.started_at)}. This can take a few minutes; you can leave this page.
            </Banner>
          ) : latest.status === "failed" ? (
            <Banner tone="crit" title="The last build did not finish" role="alert">
              {latest.error || "No reason was recorded."}
            </Banner>
          ) : latest.draft_version !== null ? (
            <Banner tone="pos" title={`Draft version ${latest.draft_version} is ready for review`} role="status" actions={<Link href={playbook} className="shrink-0 text-[13px] font-medium text-accent hover:underline">Review it</Link>}>
              Built {dateTime(latest.finished_at)}. It is not live until you approve it.
            </Banner>
          ) : null}
        </div>
      )}
      {asking ? (
        <Confirm label="Build a draft playbook" confirmLabel="Build draft" busy={busy} error={error} onConfirm={start} onCancel={() => (setAsking(false), setError(null))}>
          Build a new draft from the script and {ready} ready {ready === 1 ? "source" : "sources"}? This uses the AI model and can take a few minutes. Nothing changes on live calls.
        </Confirm>
      ) : !canOperate ? (
        <p className="t-meta">An operator or admin can build a draft.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" disabled={running || stillReading > 0} onClick={() => setAsking(true)}>
            Build a draft playbook
          </Button>
          {stillReading > 0 && <p className="t-meta">Wait until every source has been read.</p>}
        </div>
      )}
    </Panel>
  );
}

export default function KnowledgePage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent(use(params).name);
  const { data, error, loading, reload } = useApi(backendUrl(["campaigns", name, "documents"]), documentListSchema);
  const [notice, setNotice] = useState<Notice>(null);
  const closeNotice = useCallback(() => setNotice(null), []);
  const changed = (n: Notice) => (setNotice(n), reload());
  const { canOperate } = useAccess();

  // A source is read in the background: keep the list current until none is waiting.
  const waiting = data?.some(reading) ?? false;
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(reload, 2500);
    return () => clearInterval(timer);
  }, [waiting, reload]);

  return (
    <div className="space-y-6">
      <NoticeBar notice={notice} onClose={closeNotice} />
      {canOperate && <AddSources campaign={name} onAdded={changed} />}
      {loading && !data ? (
        <Loading what="Loading sources" strip={false} rows={4} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data && data.length === 0 ? (
        <EmptyState icon={FileText} title="The agent has no documents yet">{!canOperate && "An operator or admin can add them. "}Upload price lists, product sheets, FAQs or case studies, or add your website. The agent looks facts up in them during calls instead of guessing.</EmptyState>
      ) : data ? (
        <Sources campaign={name} documents={data} onChanged={changed} />
      ) : null}
      {data && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 [&>*]:min-w-0">
          <KnowledgeTest campaign={name} />
          <Training campaign={name} documents={data} />
        </div>
      )}
    </div>
  );
}
