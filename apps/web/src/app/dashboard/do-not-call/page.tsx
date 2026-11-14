"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";
import { Upload } from "lucide-react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { count, dateTime } from "@/lib/api/format";
import { doNotCallImportSchema, doNotCallSchema, erasureSchema, type DoNotCallEntry, type Erasure } from "@/lib/api/schemas";
import { useAccess } from "@/components/dashboard/access";
import { Banner, Button, Confirm, DataTable, EmptyState, ErrorState, Field, Input, Loading, NoticeBar, PageHeader, Panel, type Column, type Notice } from "@/components/dashboard/ui";

const sentence = (text: string) => text[0].toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? "" : ".");
const failure = (e: unknown) => sentence(e instanceof ApiError ? e.message : "Something went wrong. Try again.");

/** Add one number, or a whole list (a public register, another system's suppression list). */
function AddNumbers({ onDone }: { onDone: (notice: Notice) => void }) {
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  async function add(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await apiRequest(backendUrl(["do-not-call"]), doNotCallImportSchema, { method: "POST", body: { phone: phone.trim(), reason: reason.trim() } });
      onDone({ kind: "success", text: result.added ? `${phone.trim()} will not be called again.` : `${phone.trim()} was already on the list.` });
      setPhone("");
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  async function importList(file: File | undefined) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) return setError("The file is larger than 25 MB.");
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await apiRequest(backendUrl(["do-not-call", "import"], { reason: reason.trim() || `Imported from ${file.name}` }), doNotCallImportSchema, { method: "POST", form });
      const skipped = result.invalid ? ` ${count(result.invalid)} could not be read as ${result.invalid === 1 ? "a phone number" : "phone numbers"}${result.samples_invalid.length ? ` (such as "${result.samples_invalid[0]}")` : ""}.` : "";
      onDone({ kind: result.invalid && !result.added ? "error" : "success", text: `${count(result.added)} ${result.added === 1 ? "number" : "numbers"} added, ${count(result.already_listed)} already on the list.${skipped}` });
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Add numbers" description="A number on this list is never called and cannot be added to a campaign. Anyone already in a call list is taken out of it at once.">
      <form onSubmit={add} className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0" noValidate>
        <Field label="Phone number" hint="In international form, such as +14155550100.">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="off" placeholder="+14155550100" />
        </Field>
        <Field label="Reason" hint="Optional: who asked, or which list this is.">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} autoComplete="off" />
        </Field>
        {error && (
          <p className="text-[13px] font-medium text-crit sm:col-span-2" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" variant="primary" busy={busy} disabled={!phone.trim()}>
            Add number
          </Button>
          <Button onClick={() => picker.current?.click()} disabled={busy}>
            <Upload className="size-3.5" aria-hidden="true" />
            Import a list
          </Button>
          <input ref={picker} type="file" accept=".csv,.txt" className="sr-only" aria-label="Choose a list of numbers to import" onChange={(e) => (void importList(e.target.files?.[0]), (e.target.value = ""))} />
        </div>
        <p className="t-meta sm:col-span-2">A list is a text or CSV file with one number per line, or with the numbers in its first column.</p>
      </form>
    </Panel>
  );
}

/** Remove what is held about one person. For an admin; it cannot be undone. */
function ErasePerson({ onDone }: { onDone: () => void }) {
  const [phone, setPhone] = useState("");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Erasure | null>(null);

  async function erase() {
    setBusy(true);
    setError(null);
    try {
      setResult(await apiRequest(backendUrl(["people", "erase"]), erasureSchema, { method: "POST", body: { phone: phone.trim() } }));
      setAsking(false);
      setPhone("");
      onDone();
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Erase a person" description="When someone asks for what you hold about them to be removed. Their details, what was said on their calls and messages they sent are deleted; the number stays on this list so they are never called again.">
      <div className="grid max-w-2xl gap-4">
        <Field label="Their phone number" className="max-w-xs">
          <Input value={phone} onChange={(e) => (setPhone(e.target.value), setResult(null))} inputMode="tel" autoComplete="off" placeholder="+14155550100" aria-label="Phone number of the person to erase" />
        </Field>
        {asking ? (
          <Confirm label="Erase this person" confirmLabel="Erase" tone="danger" busy={busy} onConfirm={erase} onCancel={() => setAsking(false)} error={error}>
            Everything held about <strong className="t-figure font-medium text-fg">{phone.trim()}</strong> is removed. This cannot be undone.
          </Confirm>
        ) : (
          <div>
            <Button variant="danger" disabled={!phone.trim()} onClick={() => (setError(null), setResult(null), setAsking(true))}>
              Erase this person…
            </Button>
          </div>
        )}
        {result && (
          <Banner tone={result.leads || result.website_messages ? "pos" : "info"} title={result.leads || result.website_messages ? "Erased" : "Nothing was held about this number"} role="status" testId="erased">
            <p>
              {count(result.leads)} lead records, {count(result.calls)} calls, {count(result.website_messages)} website messages.
              {result.on_do_not_call_list ? " The number is on the do-not-call list." : ""}
            </p>
            {result.recordings_to_delete_at_the_provider.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-fg">Recordings to delete at your phone provider</p>
                <p className="t-meta mb-1.5">They are held there, not here. This list is shown once.</p>
                <ul className="t-figure space-y-1 text-[12.5px] break-all">
                  {result.recordings_to_delete_at_the_provider.map((url) => (
                    <li key={url}>{url}</li>
                  ))}
                </ul>
              </div>
            )}
          </Banner>
        )}
      </div>
    </Panel>
  );
}

export default function DoNotCallPage() {
  const { canOperate, isAdmin } = useAccess();
  const [q, setQ] = useState("");
  const { data, error, loading, reload } = useApi(backendUrl(["do-not-call"], { q: q.trim() || undefined, limit: 200 }), doNotCallSchema);
  const [notice, setNotice] = useState<Notice>(null);
  const closeNotice = useCallback(() => setNotice(null), []);
  const [removing, setRemoving] = useState<DoNotCallEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function remove() {
    if (!removing) return;
    setBusy(true);
    setProblem(null);
    try {
      await apiRequest(backendUrl(["do-not-call", removing.id]), doNotCallSchema.shape.entries.element.partial().passthrough(), { method: "DELETE" });
      setNotice({ kind: "success", text: `${removing.phone} was taken off the list and may be called again.` });
      setRemoving(null);
      reload();
    } catch (e) {
      setProblem(failure(e));
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<DoNotCallEntry>[] = [
    { key: "phone", label: "Number", primary: true, sortValue: (e) => e.phone, render: (e) => <span className="t-figure font-medium text-fg">{e.phone}</span> },
    { key: "reason", label: "Reason", sortValue: (e) => e.reason.toLowerCase(), render: (e) => <span className="text-fg-2">{e.reason || "Not given"}</span> },
    { key: "added", label: "Added", sortValue: (e) => e.added_at ?? "", render: (e) => <span className="text-fg-2">{dateTime(e.added_at)}</span> },
    {
      key: "actions",
      label: "",
      render: (e) =>
        isAdmin ? (
          <span className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => (setProblem(null), setRemoving(e))} aria-label={`Take ${e.phone} off the list`}>
              Remove
            </Button>
          </span>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <NoticeBar notice={notice} onClose={closeNotice} />
      <PageHeader title="Do not call" description="The numbers this organization never calls: people who asked not to be called, and any list you add." />
      {canOperate && <AddNumbers onDone={(n) => (setNotice(n), reload())} />}
      {removing && (
        <Confirm label={`Take ${removing.phone} off the list`} confirmLabel="Remove from the list" tone="danger" busy={busy} onConfirm={remove} onCancel={() => setRemoving(null)} error={problem}>
          <strong className="t-figure font-medium text-fg">{removing.phone}</strong> may be called again after this. Do it only if the person said so, or the entry was a mistake.
        </Confirm>
      )}
      <Panel
        flush
        title={data ? `${count(data.total)} ${data.total === 1 ? "number" : "numbers"}` : "Numbers"}
        actions={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a number" aria-label="Find a number" className="w-44" inputMode="tel" />}
      >
        {loading && !data ? (
          <Loading what="Loading the list" strip={false} rows={4} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : data && data.entries.length === 0 ? (
          <EmptyState title={q.trim() ? "No number matches" : "Nobody is on the list yet"}>{q.trim() ? "Check the digits you typed." : "People who ask not to be called during a call are added here by themselves."}</EmptyState>
        ) : data ? (
          <DataTable columns={columns} rows={data.entries} rowKey={(e) => e.id} caption="Numbers that are never called" testId="do-not-call" />
        ) : null}
      </Panel>
      {isAdmin && <ErasePerson onDone={reload} />}
    </div>
  );
}
