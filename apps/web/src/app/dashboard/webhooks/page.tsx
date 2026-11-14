"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Webhook } from "lucide-react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { count, dateTime } from "@/lib/api/format";
import { newWebhookSchema, webhookDeliveryListSchema, webhookDeliverySchema, webhookEndpointSchema, webhookListSchema, type WebhookDelivery, type WebhookEndpoint } from "@/lib/api/schemas";
import { useAccess } from "@/components/dashboard/access";
import { CopyField } from "@/components/dashboard/CopyField";
import { EVENT_LABELS, describeEvents, orderedEvents } from "./events";
import { Banner, Button, Confirm, DataTable, Drawer, EmptyState, ErrorState, Field, Input, Loading, NoticeBar, PageHeader, Panel, Status, Tag, type Column, type Notice } from "@/components/dashboard/ui";

const sentence = (text: string) => text[0].toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? "" : ".");
const failure = (e: unknown) => sentence(e instanceof ApiError ? e.message : "Something went wrong. Try again.");

function NewEndpoint({ events, onCreated, onClose }: { events: string[]; onCreated: (secret: string, url: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [chosen, setChosen] = useState<string[]>(["call.finalized", "appointment.booked"].filter((e) => events.includes(e)));
  const [everything, setEverything] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await apiRequest(backendUrl(["webhooks"]), newWebhookSchema, { method: "POST", body: { url: url.trim(), description: description.trim(), events: everything ? ["*"] : chosen } });
      onCreated(created.secret, created.url);
      onClose();
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="New endpoint" description="An address of one of your own systems. It receives a signed POST for each event you choose.">
      <form onSubmit={create} className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0" noValidate>
        <Field label="Address" hint="Must start with https:// and be reachable from the internet.">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} type="url" inputMode="url" autoComplete="off" autoFocus placeholder="https://crm.example.com/hooks/devytalk" maxLength={500} />
        </Field>
        <Field label="What it is" hint="Optional. Shown in the list.">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} autoComplete="off" placeholder="CRM" />
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="t-label mb-2">Events to send</legend>
          <label className="mb-2 flex items-center gap-2.5 text-[13.5px] text-fg">
            <input type="checkbox" className="size-4 accent-[var(--color-accent)]" checked={everything} onChange={(e) => setEverything(e.target.checked)} />
            Everything, including events added later
          </label>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {orderedEvents(events).map((name) => (
              <label key={name} className="flex items-start gap-2.5 text-[13.5px] text-fg">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-[var(--color-accent)]"
                  disabled={everything}
                  checked={everything || chosen.includes(name)}
                  onChange={(e) => setChosen((now) => (e.target.checked ? [...now, name] : now.filter((n) => n !== name)))}
                />
                <span className="min-w-0">
                  {EVENT_LABELS[name] ?? name}
                  <span className="t-meta t-figure block">{name}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p className="text-[13px] font-medium text-crit sm:col-span-2" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" variant="primary" busy={busy} disabled={!url.trim() || (!everything && chosen.length === 0)}>
            Add endpoint
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

const DELIVERY_TONE = { delivered: "pos", failed: "crit", pending: "warn" } as const;
const DELIVERY_TEXT = { delivered: "Delivered", failed: "Failed", pending: "Trying" } as const;

function Deliveries({ endpoint, onClose }: { endpoint: WebhookEndpoint; onClose: () => void }) {
  const { data, error, loading, reload } = useApi(backendUrl(["webhooks", endpoint.id, "deliveries"], { limit: 100 }), webhookDeliveryListSchema);
  const [busy, setBusy] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function again(delivery: WebhookDelivery) {
    setBusy(delivery.id);
    setProblem(null);
    try {
      await apiRequest(backendUrl(["webhooks", endpoint.id, "deliveries", delivery.id, "redeliver"]), webhookDeliverySchema, { method: "POST" });
      reload();
    } catch (e) {
      setProblem(failure(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Drawer label="Deliveries" title="Deliveries" subtitle={<span className="t-figure break-all">{endpoint.url}</span>} onClose={onClose}>
      {problem && (
        <p className="mb-3 text-[13px] font-medium text-crit" role="alert">
          {problem}
        </p>
      )}
      {loading && !data ? (
        <Loading what="Loading deliveries" strip={false} rows={4} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data && data.length === 0 ? (
        <EmptyState title="Nothing has been sent yet">Send a test, or wait for the first event.</EmptyState>
      ) : (
        <ul className="divide-y divide-line" data-testid="deliveries">
          {(data ?? []).map((d) => (
            <li key={d.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <Status tone={DELIVERY_TONE[d.status]}>{DELIVERY_TEXT[d.status]}</Status>
                  <span className="t-figure text-[13px] text-fg">{d.event}</span>
                </p>
                <p className="t-meta mt-0.5">
                  {dateTime(d.created_at)} · {d.attempts === 1 ? "1 attempt" : `${count(d.attempts)} attempts`}
                  {d.response_status ? ` · answered ${d.response_status}` : ""}
                  {d.duration_ms !== null ? ` · ${count(d.duration_ms)} ms` : ""}
                </p>
                {d.error && <p className="mt-1 text-[12.5px] text-crit">{sentence(d.error)}</p>}
              </div>
              {d.status === "failed" && d.event !== "ping" && (
                <Button size="sm" busy={busy === d.id} onClick={() => again(d)}>
                  Send again
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}

type Asking = { endpoint: WebhookEndpoint; what: "remove" | "secret" | "off" };

export default function WebhooksPage() {
  const { isAdmin } = useAccess();
  const { data, error, loading, reload } = useApi(backendUrl(["webhooks"]), webhookListSchema);
  const [notice, setNotice] = useState<Notice>(null);
  const closeNotice = useCallback(() => setNotice(null), []);
  const [adding, setAdding] = useState(false);
  const [fresh, setFresh] = useState<{ secret: string; url: string } | null>(null);
  const [asking, setAsking] = useState<Asking | null>(null);
  const [showing, setShowing] = useState<WebhookEndpoint | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function act(key: string, work: () => Promise<void>) {
    setBusy(key);
    setProblem(null);
    try {
      await work();
      setAsking(null);
      reload();
    } catch (e) {
      if (asking) setProblem(failure(e));
      else setNotice({ kind: "error", text: failure(e) });
    } finally {
      setBusy(null);
    }
  }

  const test = (endpoint: WebhookEndpoint) =>
    act(`test-${endpoint.id}`, async () => {
      const result = await apiRequest(backendUrl(["webhooks", endpoint.id, "test"]), webhookDeliverySchema, { method: "POST" });
      setNotice(
        result.status === "delivered"
          ? { kind: "success", text: `The test arrived: the endpoint answered ${result.response_status}.` }
          : { kind: "error", text: `The test did not arrive. ${sentence(result.error ?? "The endpoint did not answer")}` },
      );
    });
  const setActive = (endpoint: WebhookEndpoint, active: boolean) =>
    act(`active-${endpoint.id}`, async () => {
      await apiRequest(backendUrl(["webhooks", endpoint.id]), webhookEndpointSchema, { method: "PATCH", body: { active } });
      setNotice({ kind: "success", text: active ? "Switched on. Events from now on are sent." : "Switched off. Nothing is sent, and events in the meantime are not kept for it." });
    });
  const confirmed = () => {
    if (!asking) return;
    const { endpoint, what } = asking;
    if (what === "off") return setActive(endpoint, false);
    if (what === "secret")
      return act("confirm", async () => {
        const rotated = await apiRequest(backendUrl(["webhooks", endpoint.id, "secret"]), newWebhookSchema, { method: "POST" });
        setFresh({ secret: rotated.secret, url: rotated.url });
      });
    return act("confirm", async () => {
      await apiRequest(backendUrl(["webhooks", endpoint.id]), webhookEndpointSchema, { method: "DELETE" });
      setNotice({ kind: "success", text: "The endpoint was removed. Nothing more is sent to it." });
    });
  };

  const columns: Column<WebhookEndpoint>[] = [
    {
      key: "url",
      label: "Endpoint",
      primary: true,
      sortValue: (e) => e.url,
      render: (e) => (
        <span className="block min-w-0">
          <span className="t-figure block truncate font-medium text-fg">{e.url}</span>
          <span className="t-meta block truncate">{e.description || "No description"}</span>
        </span>
      ),
    },
    {
      key: "events",
      label: "Events",
      render: (e) => (
        <span title={e.events.includes("*") ? "Every event" : e.events.join(", ")}>
          <Tag>{describeEvents(e.events)}</Tag>
        </span>
      ),
    },
    {
      key: "state",
      label: "State",
      sortValue: (e) => Number(e.active),
      render: (e) => (
        <span className="block min-w-0">
          <Status tone={e.active ? "pos" : "crit"}>{e.active ? "On" : "Switched off"}</Status>
          {!e.active && e.disabled_reason && <span className="t-meta mt-0.5 block max-w-xs whitespace-normal">{sentence(e.disabled_reason)}</span>}
        </span>
      ),
    },
    {
      key: "last",
      label: "Last delivery",
      sortValue: (e) => e.last_delivery_at ?? "",
      render: (e) =>
        e.last_delivery_at ? (
          <span className="block">
            <Status tone={e.last_status && e.last_status < 300 ? "pos" : "crit"}>{e.last_status ? `Answered ${e.last_status}` : "No answer"}</Status>
            <span className="t-meta block">{dateTime(e.last_delivery_at)}</span>
          </span>
        ) : (
          <span className="text-fg-2">Never</span>
        ),
    },
    {
      key: "actions",
      label: "",
      render: (e) => (
        <span className="flex flex-wrap justify-end gap-1">
          <Button size="sm" variant="ghost" busy={busy === `test-${e.id}`} onClick={() => test(e)} aria-label={`Send a test to ${e.url}`}>
            Send test
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowing(e)} aria-label={`Deliveries to ${e.url}`}>
            Deliveries
          </Button>
          {e.active ? (
            <Button size="sm" variant="ghost" onClick={() => (setProblem(null), setAsking({ endpoint: e, what: "off" }))}>
              Switch off
            </Button>
          ) : (
            <Button size="sm" variant="ghost" busy={busy === `active-${e.id}`} onClick={() => setActive(e, true)}>
              Switch on
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => (setProblem(null), setAsking({ endpoint: e, what: "secret" }))}>
            New secret
          </Button>
          <Button size="sm" variant="ghost" onClick={() => (setProblem(null), setAsking({ endpoint: e, what: "remove" }))}>
            Remove
          </Button>
        </span>
      ),
    },
  ];

  const question = asking && {
    remove: { label: "Remove endpoint", confirm: "Remove endpoint", text: "Nothing more is sent to it, and the record of what was sent is removed." },
    secret: { label: "Replace the secret", confirm: "Replace the secret", text: "Deliveries are signed with the new secret at once. Your system refuses them until it has the new one." },
    off: { label: "Switch off", confirm: "Switch off", text: "Nothing is sent while it is off, and events in the meantime are not kept for it." },
  }[asking.what];

  return (
    <div className="space-y-6">
      <NoticeBar notice={notice} onClose={closeNotice} />
      <PageHeader
        title="Webhooks"
        description="Have your own systems told when a call ends or a meeting is booked, instead of asking."
        actions={
          isAdmin && !adding && data ? (
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Webhook className="size-3.5" aria-hidden="true" />
              New endpoint
            </Button>
          ) : undefined
        }
      />
      {fresh && (
        <Banner tone="pos" title="Copy the signing secret now" role="status" testId="new-secret" actions={<Button onClick={() => setFresh(null)}>I have copied it</Button>}>
          <p className="mb-3">
            For <span className="t-figure break-all">{fresh.url}</span>. It is shown this once. Your system uses it to check that a delivery is from here.
          </p>
          <CopyField label="Signing secret" value={fresh.secret} />
        </Banner>
      )}
      {adding && data && <NewEndpoint events={data.events} onCreated={(secret, url) => (setFresh({ secret, url }), reload())} onClose={() => setAdding(false)} />}
      {asking && question && (
        <Confirm label={question.label} confirmLabel={question.confirm} tone="danger" busy={busy !== null} onConfirm={confirmed} onCancel={() => setAsking(null)} error={problem}>
          <strong className="t-figure font-medium break-all text-fg">{asking.endpoint.url}</strong>: {question.text}
        </Confirm>
      )}
      <Panel flush title="Endpoints">
        {loading && !data ? (
          <Loading what="Loading endpoints" strip={false} rows={3} />
        ) : error ? (
          <ErrorState message={error.status === 403 ? "Only an admin of this organization manages webhooks." : error.message} onRetry={error.status === 403 ? undefined : reload} />
        ) : data && data.endpoints.length === 0 ? (
          <EmptyState title="No endpoints yet">Add the address of your CRM or calendar to be told about calls and bookings as they happen.</EmptyState>
        ) : data ? (
          <DataTable columns={columns} rows={data.endpoints} rowKey={(e) => e.id} caption="Webhook endpoints" testId="webhooks" />
        ) : null}
      </Panel>
      <Panel title="What your system receives" description="A POST with a JSON body, signed with the endpoint's secret.">
        <ul className="list-disc space-y-1.5 pl-5 text-[13.5px] text-fg-2">
          <li>
            Check the <code className="t-figure">X-Callagent-Signature</code> header before trusting a delivery: HMAC-SHA256 of the timestamp, a dot and the raw body.
          </li>
          <li>Answer with a 2xx status within 10 seconds. Anything else is tried again for about an hour.</li>
          <li>The same event can arrive twice, and events can arrive out of order. Use the event&apos;s id to ignore repeats.</li>
          <li>An endpoint that fails 15 deliveries in a row is switched off, and says why here.</li>
        </ul>
      </Panel>
      {showing && <Deliveries endpoint={showing} onClose={() => setShowing(null)} />}
    </div>
  );
}
