"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Building2 } from "lucide-react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { dateTime } from "@/lib/api/format";
import { organizationListSchema, organizationSchema, type Organization } from "@/lib/api/schemas";
import { useAccess } from "@/components/dashboard/access";
import { Banner, Button, DataTable, ErrorState, Field, Input, Loading, NoticeBar, PageHeader, Panel, Status, Textarea, type Column, type Notice } from "@/components/dashboard/ui";
import { passwordProblem } from "../team/page";

const sentence = (text: string) => text[0].toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? "" : ".");

/** The deployment's operator creates a customer organization and its first admin. Everything else the admin does themselves. */
function NewOrganization({ onCreated, onClose }: { onCreated: (notice: Notice) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", admin_name: "", admin_email: "", admin_password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weak, setWeak] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function create(event: FormEvent) {
    event.preventDefault();
    const problem = passwordProblem(form.admin_password, form.admin_email);
    setWeak(problem);
    if (problem) return;
    setBusy(true);
    setError(null);
    try {
      const created = await apiRequest(backendUrl(["organizations"]), organizationSchema.passthrough(), { method: "POST", body: form });
      onCreated({ kind: "success", text: `${created.name} was created. ${form.admin_email} can sign in and add the rest of their team. Give them the password yourself; it is not sent by email.` });
      onClose();
    } catch (e) {
      setError(sentence(e instanceof ApiError ? e.message : "Something went wrong. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="New organization" description="A separate customer: its own campaigns, leads, calls, documents, do-not-call list and people. Nobody in it can see another organization.">
      <form onSubmit={create} className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0" noValidate>
        <Field label="Organization name" className="sm:col-span-2">
          <Input value={form.name} onChange={set("name")} maxLength={200} autoComplete="off" autoFocus />
        </Field>
        <Field label="First admin's name">
          <Input value={form.admin_name} onChange={set("admin_name")} maxLength={200} autoComplete="off" />
        </Field>
        <Field label="First admin's email">
          <Input type="email" inputMode="email" value={form.admin_email} onChange={set("admin_email")} autoComplete="off" />
        </Field>
        <Field label="Their first password" hint="At least 10 characters. They can change it after signing in." error={weak} className="sm:col-span-2 sm:max-w-xs">
          <Input type="password" value={form.admin_password} onChange={set("admin_password")} autoComplete="new-password" />
        </Field>
        {error && (
          <p className="text-[13px] font-medium text-crit sm:col-span-2" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" variant="primary" busy={busy} disabled={!form.name.trim() || !form.admin_email.trim() || !form.admin_password}>
            Create organization
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

/** The numbers an organization calls from are assigned here, by the operator: they must be numbers held at the phone provider. */
function AssignNumbers({ organization, onSaved, onClose }: { organization: Organization; onSaved: (notice: Notice) => void; onClose: () => void }) {
  const [numbers, setNumbers] = useState(organization.from_numbers.join("\n"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const from_numbers = numbers.split(/[\n,]+/).map((n) => n.trim()).filter(Boolean);
      await apiRequest(backendUrl(["organizations", organization.id, "telephony"]), organizationSchema.passthrough(), { method: "PUT", body: { from_numbers } });
      onSaved({ kind: "success", text: from_numbers.length ? `${organization.name} now calls from ${from_numbers.length === 1 ? "that number" : `those ${from_numbers.length} numbers`}.` : `${organization.name} has no number and cannot place calls.` });
      onClose();
    } catch (e) {
      setError(sentence(e instanceof ApiError ? e.message : "Something went wrong. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title={`Caller numbers of ${organization.name === "default" ? "the default organization" : organization.name}`} description="The numbers its calls go out from. They must be numbers you hold at the phone provider, and a number belongs to one organization.">
      <form onSubmit={save} className="grid max-w-md gap-4" noValidate>
        <Field label="Caller numbers" hint="One per line, in international form, such as +14155550100. Empty: the organization cannot place calls.">
          <Textarea value={numbers} onChange={(e) => setNumbers(e.target.value)} rows={3} className="t-figure" autoFocus />
        </Field>
        {error && (
          <p className="text-[13px] font-medium text-crit" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" busy={busy}>
            Assign numbers
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export default function OrganizationsPage() {
  const { me } = useAccess();
  const { data, error, loading, reload } = useApi(backendUrl(["organizations"]), organizationListSchema);
  const [notice, setNotice] = useState<Notice>(null);
  const closeNotice = useCallback(() => setNotice(null), []);
  const [adding, setAdding] = useState(false);
  const [numbering, setNumbering] = useState<Organization | null>(null);

  const columns: Column<Organization>[] = [
    {
      key: "name",
      label: "Organization",
      primary: true,
      sortValue: (o) => o.name.toLowerCase(),
      render: (o) => (
        <span className="block">
          <span className="font-medium text-fg">{o.name === "default" ? "Default organization" : o.name}</span>
          {me?.organization.id === o.id && <span className="t-meta block">The one you are working in</span>}
        </span>
      ),
    },
    { key: "people", label: "People", numeric: true, sortValue: (o) => o.users, render: (o) => `${o.active_users} active of ${o.users}` },
    {
      key: "numbers",
      label: "Calls from",
      render: (o) =>
        o.from_numbers.length ? (
          <span className="t-figure text-fg-2">{o.from_numbers.join(", ")}</span>
        ) : o.name === "default" ? (
          <span className="text-fg-3">The deployment&apos;s number</span>
        ) : (
          <Status tone="warn">No number</Status>
        ),
    },
    { key: "created", label: "Created", sortValue: (o) => o.created_at ?? "", render: (o) => <span className="text-fg-2">{dateTime(o.created_at)}</span> },
    {
      key: "actions",
      label: "",
      render: (o) => (
        <span className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => (setAdding(false), setNumbering(o))} aria-label={`Assign numbers to ${o.name}`}>
            Numbers
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <NoticeBar notice={notice} onClose={closeNotice} />
      <PageHeader
        title="Organizations"
        description="The customers on this deployment. Each is separate from the others."
        actions={
          me?.platform && !adding ? (
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Building2 className="size-3.5" aria-hidden="true" />
              New organization
            </Button>
          ) : undefined
        }
      />
      {adding && <NewOrganization onCreated={(n) => (setNotice(n), reload())} onClose={() => setAdding(false)} />}
      {numbering && <AssignNumbers key={numbering.id} organization={numbering} onSaved={(n) => (setNotice(n), reload())} onClose={() => setNumbering(null)} />}
      {loading && !data ? (
        <Loading what="Loading organizations" strip={false} rows={3} />
      ) : error ? (
        error.status === 403 ? (
          <Banner tone="warn" title="Only the operator of this deployment manages organizations" role="alert">
            You work inside your own organization; its people are under Team.
          </Banner>
        ) : (
          <ErrorState message={error.message} onRetry={reload} />
        )
      ) : data ? (
        <Panel flush>
          <DataTable columns={columns} rows={data} rowKey={(o) => o.id} caption="Organizations" testId="organizations" />
        </Panel>
      ) : null}
    </div>
  );
}
