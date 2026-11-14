"use client";

import { useCallback, useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { dateTime } from "@/lib/api/format";
import { apiKeyListSchema, apiKeySchema, newApiKeySchema, type ApiKey } from "@/lib/api/schemas";
import { useAccess } from "@/components/dashboard/access";
import { CopyField } from "@/components/dashboard/CopyField";
import { Banner, Button, Confirm, DataTable, EmptyState, ErrorState, Field, Input, Loading, NoticeBar, PageHeader, Panel, Select, Status, type Column, type Notice } from "@/components/dashboard/ui";

const sentence = (text: string) => text[0].toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? "" : ".");
const ROLES: [ApiKey["role"], string, string][] = [
  ["viewer", "Viewer", "Reads everything; changes nothing."],
  ["operator", "Operator", "Also runs campaigns: start, pause, add leads and documents."],
  ["admin", "Admin", "Also decides what goes live and what it may cost."],
];

function NewKey({ onCreated, onClose }: { onCreated: (key: string, name: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<ApiKey["role"]>("viewer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await apiRequest(backendUrl(["keys"]), newApiKeySchema, { method: "POST", body: { name: name.trim(), role } });
      onCreated(created.key, created.name);
      onClose();
    } catch (e) {
      setError(sentence(e instanceof ApiError ? e.message : "Something went wrong. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="New API key" description="For one of your own systems. Give each system its own key, so one can be revoked without stopping the others.">
      <form onSubmit={create} className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0" noValidate>
        <Field label="What will use it" hint="Shown in the list and in the record of who changed what.">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="off" autoFocus placeholder="CRM sync" />
        </Field>
        <Field label="What it may do" hint={ROLES.find(([r]) => r === role)?.[2]}>
          <Select value={role} onChange={(e) => setRole(e.target.value as ApiKey["role"])}>
            {ROLES.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </Select>
        </Field>
        {error && (
          <p className="text-[13px] font-medium text-crit sm:col-span-2" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" variant="primary" busy={busy} disabled={!name.trim()}>
            Create key
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export default function ApiKeysPage() {
  const { isAdmin } = useAccess();
  const { data, error, loading, reload } = useApi(backendUrl(["keys"]), apiKeyListSchema);
  const [notice, setNotice] = useState<Notice>(null);
  const closeNotice = useCallback(() => setNotice(null), []);
  const [adding, setAdding] = useState(false);
  const [fresh, setFresh] = useState<{ key: string; name: string } | null>(null);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function revoke() {
    if (!revoking) return;
    setBusy(true);
    setProblem(null);
    try {
      await apiRequest(backendUrl(["keys", revoking.id]), apiKeySchema, { method: "DELETE" });
      setNotice({ kind: "success", text: `${revoking.name} was revoked. Anything still using it is refused from now on.` });
      setRevoking(null);
      reload();
    } catch (e) {
      setProblem(sentence(e instanceof ApiError ? e.message : "Something went wrong. Try again."));
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<ApiKey>[] = [
    {
      key: "name",
      label: "Key",
      primary: true,
      sortValue: (k) => k.name.toLowerCase(),
      render: (k) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium text-fg">{k.name}</span>
          <span className="t-meta t-figure block">{k.starts_with}…</span>
        </span>
      ),
    },
    { key: "role", label: "May", sortValue: (k) => k.role, render: (k) => ROLES.find(([r]) => r === k.role)?.[1] ?? k.role },
    { key: "state", label: "State", sortValue: (k) => Number(!k.revoked_at), render: (k) => <Status tone={k.revoked_at ? "neutral" : "pos"}>{k.revoked_at ? "Revoked" : "Active"}</Status> },
    { key: "used", label: "Last used", sortValue: (k) => k.last_used_at ?? "", render: (k) => <span className="text-fg-2">{k.last_used_at ? dateTime(k.last_used_at) : "Never"}</span> },
    { key: "created", label: "Created", sortValue: (k) => k.created_at ?? "", render: (k) => <span className="text-fg-2">{dateTime(k.created_at)}</span> },
    {
      key: "actions",
      label: "",
      render: (k) =>
        k.revoked_at ? null : (
          <span className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => (setProblem(null), setRevoking(k))}>
              Revoke
            </Button>
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <NoticeBar notice={notice} onClose={closeNotice} />
      <PageHeader
        title="API keys"
        description="Keys your own systems use to work with this organization's campaigns, leads and calls."
        actions={
          isAdmin && !adding ? (
            <Button variant="primary" onClick={() => setAdding(true)}>
              <KeyRound className="size-3.5" aria-hidden="true" />
              New key
            </Button>
          ) : undefined
        }
      />
      {fresh && (
        <Banner tone="pos" title={`Copy the key for ${fresh.name} now`} role="status" testId="new-key" actions={<Button onClick={() => setFresh(null)}>I have copied it</Button>}>
          <p className="mb-3">It is shown this once and is not stored. If it is lost, revoke it and create another.</p>
          <CopyField label="API key" value={fresh.key} />
          <p className="t-meta mt-3">
            Send it with each request as <code className="t-figure">Authorization: Bearer …</code>
          </p>
        </Banner>
      )}
      {adding && <NewKey onCreated={(key, name) => (setFresh({ key, name }), reload())} onClose={() => setAdding(false)} />}
      {revoking && (
        <Confirm label={`Revoke ${revoking.name}`} confirmLabel="Revoke key" tone="danger" busy={busy} onConfirm={revoke} onCancel={() => setRevoking(null)} error={problem}>
          Whatever uses <strong className="font-medium text-fg">{revoking.name}</strong> is refused at once. A revoked key cannot be restored.
        </Confirm>
      )}
      {loading && !data ? (
        <Loading what="Loading keys" strip={false} rows={3} />
      ) : error ? (
        error.status === 403 ? (
          <Banner tone="warn" title="Only an admin manages API keys" role="alert">
            Ask an admin of your organization for a key.
          </Banner>
        ) : (
          <ErrorState message={error.message} onRetry={reload} />
        )
      ) : data && data.length === 0 ? (
        <EmptyState title="No API keys yet">A key lets one of your own systems read or change this organization&apos;s data without a person signing in.</EmptyState>
      ) : data ? (
        <Panel flush>
          <DataTable columns={columns} rows={data} rowKey={(k) => k.id} caption="API keys" testId="api-keys" />
        </Panel>
      ) : null}
      <p className="t-meta max-w-2xl">A key acts only inside this organization, with the role it was given. It can never create keys, manage people or change a password.</p>
    </div>
  );
}
