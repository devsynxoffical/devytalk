"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { money } from "@/lib/api/format";
import { organizationSettingsSchema, type OrganizationSettings } from "@/lib/api/schemas";
import { useAccess } from "@/components/dashboard/access";
import { Banner, Button, ErrorState, Field, Input, KeyValues, Loading, NoticeBar, PageHeader, Panel, Status, type Notice } from "@/components/dashboard/ui";

const sentence = (text: string) => text[0].toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? "" : ".");

/** Where calls are handed to a person and where bookings are reported: the organization's own admin decides these. */
function OwnSettings({ settings, editable, onSaved }: { settings: OrganizationSettings; editable: boolean; onSaved: (notice: Notice) => void }) {
  const [transfer, setTransfer] = useState(settings.human_transfer_number ?? "");
  const [webhook, setWebhook] = useState(settings.booking_webhook_url ?? "");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTransfer(settings.human_transfer_number ?? "");
    setWebhook(settings.booking_webhook_url ?? "");
    setSecret("");
  }, [settings]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // The secret is sent only when a new one was typed: leaving it empty keeps the one already set.
      const body: Record<string, string | null> = { human_transfer_number: transfer.trim() || null, booking_webhook_url: webhook.trim() || null };
      if (secret) body.booking_webhook_secret = secret;
      await apiRequest(backendUrl(["organization", "settings"]), organizationSettingsSchema, { method: "PUT", body });
      onSaved({ kind: "success", text: "Saved. Calls that start from now on use these settings." });
    } catch (e) {
      setError(sentence(e instanceof ApiError ? e.message : "Something went wrong. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Transfers and bookings" description="Where the agent hands a call to a person, and where your own system is told about a booked meeting.">
      <form onSubmit={save} className="grid max-w-2xl grid-cols-1 gap-4 [&>*]:min-w-0" noValidate>
        <Field label="Transfer calls to" hint="A phone number in international form, such as +14155550100. Empty: the agent does not offer to transfer.">
          <Input value={transfer} onChange={(e) => setTransfer(e.target.value)} inputMode="tel" autoComplete="off" disabled={!editable} placeholder="+14155550100" />
        </Field>
        <Field label="Report bookings to" hint="An https address of your own system. Each booked meeting is sent there once, and again if your system does not answer.">
          <Input value={webhook} onChange={(e) => setWebhook(e.target.value)} inputMode="url" autoComplete="off" disabled={!editable} placeholder="https://your-system.example/bookings" />
        </Field>
        <Field
          label="Signing secret"
          hint={settings.booking_webhook_signed ? "A secret is set and is never shown. Type a new one to replace it; leave this empty to keep it." : "Optional. With a secret, each report is signed so your system can check it came from here."}
        >
          <Input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} autoComplete="new-password" disabled={!editable || !webhook.trim()} />
        </Field>
        {error && (
          <p className="text-[13px] font-medium text-crit" role="alert">
            {error}
          </p>
        )}
        {editable ? (
          <div>
            <Button type="submit" variant="primary" busy={busy}>
              Save
            </Button>
          </div>
        ) : (
          <p className="t-meta">Only an admin of this organization can change these.</p>
        )}
      </form>
    </Panel>
  );
}

export default function OrganizationSettingsPage() {
  const { me, isAdmin } = useAccess();
  const { data, error, loading, reload } = useApi(backendUrl(["organization", "settings"]), organizationSettingsSchema);
  const [notice, setNotice] = useState<Notice>(null);
  const closeNotice = useCallback(() => setNotice(null), []);
  const saved = (n: Notice) => (setNotice(n), reload());
  const name = me?.organization.name === "default" ? "Default organization" : me?.organization.name;

  return (
    <div className="space-y-6">
      <NoticeBar notice={notice} onClose={closeNotice} />
      <PageHeader title="Organization" description={name ? `What belongs to ${name} alone: the numbers it calls from, transfers, bookings and rates.` : undefined} />
      {loading && !data ? (
        <Loading what="Loading settings" strip={false} rows={4} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data ? (
        <>
          {!data.can_place_calls && (
            <Banner tone="warn" title="No phone number to call from yet" role="status" testId="no-number">
              Calls cannot be placed until the operator of this deployment assigns this organization a number. Everything else can be set up meanwhile.
            </Banner>
          )}
          <Panel title="Caller numbers and rates" description="Assigned by the operator of this deployment. With several numbers, each lead is always called from the same one.">
            <KeyValues
              rows={[
                [
                  "Calls go out from",
                  data.from_numbers.length ? (
                    <span className="flex flex-wrap gap-x-3 gap-y-1" data-testid="from-numbers">
                      {data.from_numbers.map((n) => (
                        <span key={n} className="t-figure">
                          {n}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <Status tone="warn">None assigned</Status>
                  ),
                ],
                ["Rate per connected minute", money(data.cost_per_connected_minute_usd)],
                ["Fee per call attempt", money(data.cost_per_call_attempt_usd)],
              ]}
            />
          </Panel>
          <OwnSettings settings={data} editable={isAdmin} onSaved={saved} />
        </>
      ) : null}
    </div>
  );
}
