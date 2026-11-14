"use client";

import { useCallback, useState } from "react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { dateTime } from "@/lib/api/format";
import { websiteRequestListSchema, websiteRequestSchema, type WebsiteRequest } from "@/lib/api/schemas";
import { useAccess } from "@/components/dashboard/access";
import { Button, DataTable, EmptyState, ErrorState, Loading, NoticeBar, PageHeader, Panel, Segmented, Status, Tag, type Column, type Notice, type Tone } from "@/components/dashboard/ui";

const KIND: Record<string, { text: string; tone: Tone }> = {
  demo: { text: "Demo request", tone: "pos" },
  trial: { text: "Trial sign-up", tone: "pos" },
  callback: { text: "Call back", tone: "warn" },
  contact: { text: "Message", tone: "info" },
  newsletter: { text: "Newsletter", tone: "neutral" },
};
type Filter = "new" | "handled" | "";

export default function RequestsPage() {
  const { canOperate } = useAccess();
  const [filter, setFilter] = useState<Filter>("new");
  const { data, error, loading, reload } = useApi(backendUrl(["requests"], { status: filter, limit: 100 }), websiteRequestListSchema);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const closeNotice = useCallback(() => setNotice(null), []);

  async function mark(request: WebsiteRequest, handled: boolean) {
    setBusy(request.id);
    try {
      await apiRequest(backendUrl(["requests", request.id, "handled"]), websiteRequestSchema, { method: "POST", body: { handled } });
      const who = request.name || request.email || request.phone || "The request";
      setNotice({ kind: "success", text: handled ? `${who} was marked as handled.` : `${who} is waiting again.` });
      reload();
    } catch (e) {
      setNotice({ kind: "error", text: e instanceof ApiError ? e.message : "Something went wrong. Try again." });
    } finally {
      setBusy(null);
    }
  }

  const columns: Column<WebsiteRequest>[] = [
    {
      key: "from",
      label: "From",
      primary: true,
      render: (r) => (
        <span className="block min-w-0">
          <span className="block font-medium break-words text-fg">{r.name || r.email || r.phone}</span>
          {(r.company || r.team_size) && <span className="t-meta block">{[r.company, r.team_size && `${r.team_size} people`].filter(Boolean).join(" · ")}</span>}
        </span>
      ),
    },
    { key: "kind", label: "Request", render: (r) => <Tag tone={KIND[r.kind]?.tone ?? "neutral"}>{KIND[r.kind]?.text ?? r.kind}</Tag> },
    {
      key: "contact",
      label: "Contact",
      render: (r) => (
        <span className="block min-w-0">
          {r.email && (
            <a href={`mailto:${r.email}`} className="block break-all text-accent hover:underline">
              {r.email}
            </a>
          )}
          {r.phone && (
            <a href={`tel:${r.phone.replace(/[^+\d]/g, "")}`} className="t-figure block text-accent hover:underline">
              {r.phone}
            </a>
          )}
        </span>
      ),
    },
    { key: "message", label: "Message", render: (r) => (r.message ? <span dir="auto" className="break-words whitespace-pre-line text-fg-2">{r.message}</span> : null), className: "sm:max-w-96" },
    {
      key: "received",
      label: "Received",
      sortValue: (r) => r.created_at ?? "",
      render: (r) => (
        <span className="block">
          <span className="text-fg-2">{dateTime(r.created_at)}</span>
          {r.status === "handled" && <span className="t-meta block">Handled by {r.handled_by ?? "someone"}</span>}
        </span>
      ),
    },
    {
      key: "state",
      label: "",
      render: (r) =>
        canOperate ? (
          <Button size="sm" variant={r.status === "new" ? "secondary" : "ghost"} busy={busy === r.id} onClick={() => mark(r, r.status === "new")}>
            {r.status === "new" ? "Mark handled" : "Reopen"}
          </Button>
        ) : (
          <Status tone={r.status === "new" ? "warn" : "neutral"}>{r.status === "new" ? "Waiting" : "Handled"}</Status>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <NoticeBar notice={notice} onClose={closeNotice} />
      <PageHeader title="Requests" description="What people sent through the website: demo and trial requests, messages, newsletter sign-ups and requests to be called back." />
      <Segmented
        label="Show requests"
        value={filter}
        onChange={setFilter}
        options={[
          ["new", data ? `Waiting (${data.new})` : "Waiting"],
          ["handled", "Handled"],
          ["", "All"],
        ]}
      />
      {loading && !data ? (
        <Loading what="Loading requests" strip={false} rows={5} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data && data.requests.length === 0 ? (
        <EmptyState title={filter === "new" ? "Nothing is waiting" : "No requests here"}>
          {filter === "new"
            ? "New requests from the website appear here. If the website's forms are in use and nothing ever arrives, check that the website and the calling engine share the same intake token."
            : "Change the filter to see other requests."}
        </EmptyState>
      ) : data ? (
        <Panel flush>
          <DataTable columns={columns} rows={data.requests} rowKey={(r) => r.id} caption="Requests from the website" initialSort={{ key: "received", descending: true }} testId="requests" />
        </Panel>
      ) : null}
    </div>
  );
}
