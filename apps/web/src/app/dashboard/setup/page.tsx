"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { backendUrl, useApi } from "@/lib/api/client";
import { statusSchema } from "@/lib/api/schemas";
import { Banner, ErrorState, Loading, PageHeader, Panel } from "@/components/dashboard/ui";
import { CopyField } from "@/components/dashboard/CopyField";

/** What is connected, and exactly what is still missing before real calls can be placed or answered. */
export default function SetupPage() {
  const { data, error, loading, reload } = useApi(backendUrl(["status"]), statusSchema);
  if (loading && !data) return <Loading what="Checking connections" strip={false} rows={5} />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data) return null;
  const missing = data.checks.filter((c) => !c.ok);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Setup" description="What the calling engine needs before it can place and answer real phone calls." />
      {data.ready_for_calls ? (
        <Banner tone="pos" title="Everything needed for calls is connected" role="status" testId="setup-state">
          Campaigns can dial and the agent can answer inbound calls.
        </Banner>
      ) : (
        <Banner tone="warn" title={`Calls cannot be placed or answered yet: ${missing.length} of ${data.checks.length} connections are missing`} role="status" testId="setup-state">
          You can still create campaigns, import leads, add documents and set rules. Dialing starts working once the settings below are added.
        </Banner>
      )}

      <Panel title="Connections" description="Keys are added to the calling engine's environment by whoever runs it. They are never entered here and never shown here." flush>
        <ul className="divide-y divide-line" data-testid="connections">
          {data.checks.map((check) => (
            <li key={check.key} className="flex gap-3 px-4 py-3">
              <span className={check.ok ? "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-signal text-on-signal" : "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-warn-mark text-white"} aria-hidden="true">
                {check.ok ? <Check className="size-3" /> : <X className="size-3" />}
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium text-fg">
                  {check.label} <span className="font-normal text-fg-3">· {check.ok ? "Connected" : "Not connected"}</span>
                </p>
                <p className="t-meta mt-0.5">{check.purpose}</p>
                {!check.ok && (
                  <p className="mt-1.5 text-[13px] text-fg-2">
                    Add to the engine&apos;s environment:{" "}
                    {check.missing.map((name) => (
                      <code key={name} className="t-figure mr-1.5 rounded-chip bg-sunken px-1.5 py-0.5 text-[12px] text-fg">
                        {name}
                      </code>
                    ))}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Outbound calls" description="Calls the agent places to the leads of a campaign.">
        <p className="text-[13.5px] text-fg-2">
          {data.from_number ? (
            <>
              Calls are placed from <span className="t-figure font-medium text-fg">{data.from_number}</span>.
            </>
          ) : (
            "No number to call from is set yet (TWILIO_FROM_NUMBER)."
          )}{" "}
          Open a campaign, import its leads, set its calling rules and choose Start dialing.
        </p>
      </Panel>

      <Panel title="Inbound calls" description="Calls people make to one of your numbers, answered by the agent with a campaign's playbook.">
        {data.inbound_webhook ? (
          <div className="space-y-3">
            <ol className="list-decimal space-y-1.5 pl-5 text-[13.5px] text-fg-2">
              <li>In a campaign&apos;s Settings, enter the phone number it should answer.</li>
              <li>At the phone provider, open that number and set &ldquo;A call comes in&rdquo; to the address below (HTTP POST).</li>
            </ol>
            <CopyField label="Address for inbound calls" value={data.inbound_webhook} />
          </div>
        ) : (
          <p className="text-[13.5px] text-fg-2">The engine needs its public address first (PUBLIC_BASE_URL, see Connections). The address to give the phone provider is shown here once it is set.</p>
        )}
      </Panel>

      <Panel title="Website forms" description="Demo requests, messages and call-back requests from the website.">
        <p className="text-[13.5px] text-fg-2">
          {data.website_intake ? (
            <>
              The engine accepts them. They appear under{" "}
              <Link href="/dashboard/requests" className="font-medium text-accent hover:underline">
                Requests
              </Link>
              .
            </>
          ) : (
            "Not connected: set INTAKE_TOKEN on the engine and the same value as DEVYTALK_INTAKE_TOKEN on the website. Until then the website keeps submissions in a file on its own server."
          )}
        </p>
      </Panel>
    </div>
  );
}
