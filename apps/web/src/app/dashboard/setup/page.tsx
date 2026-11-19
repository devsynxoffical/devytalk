"use client";

import Link from "next/link";
import { useState } from "react";
import { AudioLines, Brain, Check, Copy, Ear, Globe, Phone, PlugZap, type LucideIcon } from "lucide-react";
import { SERVICES } from "@/content/console-help";
import { backendUrl, useApi } from "@/lib/api/client";
import type { EngineStatus } from "@/lib/api/schemas";
import { statusSchema } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";
import { Button, ErrorState, Loading, PageHeader, Panel, Status } from "@/components/dashboard/ui";
import { CopyField } from "@/components/dashboard/CopyField";
import { missingNote } from "./missing";

const ICON: Record<string, LucideIcon> = { telephony: Phone, stt: Ear, model: Brain, tts: AudioLines, public_url: Globe };
// The order a call uses them: the line connects, the ears hear, the brain decides, the voice answers.
const ORDER = ["telephony", "stt", "model", "tts", "public_url"];
const place = (key: string) => (ORDER.indexOf(key) === -1 ? ORDER.length : ORDER.indexOf(key));

function CopyMissing({ status }: { status: EngineStatus }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(missingNote(status));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false); // the names stay readable in the list below
    }
  }
  return (
    <Button onClick={copy} size="sm">
      {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      {copied ? "Copied" : "Copy what is missing"}
    </Button>
  );
}

/** What is connected, and exactly what is still missing before real calls can be placed or answered. */
export default function SetupPage() {
  const { data, error, loading, reload } = useApi(backendUrl(["status"]), statusSchema);
  if (loading && !data) return <Loading what="Checking connections" strip={false} rows={5} />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!data) return null;
  const missing = data.checks.filter((c) => !c.ok);
  const connected = data.checks.length - missing.length;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Setup" hint="connections" description="A call needs a few outside services working together. This page shows which are connected and what to do about the rest." />

      <section className={cn("rounded-panel px-4 py-4", data.ready_for_calls ? "bg-pos-bg" : "bg-warn-bg")} role="status" data-testid="setup-state">
        <div>
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface text-fg" aria-hidden="true">
              {data.ready_for_calls ? <Check className="size-[18px]" /> : <PlugZap className="size-[18px]" />}
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-fg">
                {data.ready_for_calls ? "Everything needed for calls is connected" : `Calls cannot be placed or answered yet: ${missing.length} of ${data.checks.length} connections are missing`}
              </p>
              <p className="mt-0.5 text-[13px] text-fg-2">
                {data.ready_for_calls ? "Campaigns can dial and the agent can answer inbound calls." : "You can already create campaigns, import leads, add documents and set calling rules. Dialing starts working once the rest is connected."}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3.5 flex items-center gap-3 pl-12">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface" role="progressbar" aria-label="Connections made" aria-valuemin={0} aria-valuemax={data.checks.length} aria-valuenow={connected}>
            <div className={cn("h-full rounded-full transition-[width] duration-500", data.ready_for_calls ? "bg-signal" : "bg-warn-mark")} style={{ width: `${(connected / data.checks.length) * 100}%` }} />
          </div>
          <p className="t-figure shrink-0 text-[12.5px] font-medium text-fg">
            {connected} of {data.checks.length} connected
          </p>
          <button type="button" onClick={reload} className="shrink-0 text-[13px] font-medium text-accent hover:underline">
            Check again
          </button>
        </div>
      </section>

      <Panel
        title="What a call needs"
        description={missing.length > 0 ? "The keys go into the calling engine's own settings, by whoever runs it. They are never typed into this console and never shown here." : "All connected. The keys live in the calling engine's own settings and are never shown here."}
        actions={missing.length > 0 ? <CopyMissing status={data} /> : undefined}
        flush
      >
        <ul className="divide-y divide-line" data-testid="connections">
          {[...data.checks].sort((a, b) => place(a.key) - place(b.key)).map((check) => {
            const service = SERVICES[check.key];
            const Icon = ICON[check.key] ?? PlugZap;
            return (
              <li key={check.key} className="flex gap-3.5 px-4 py-4">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-control", check.ok ? "bg-pos-bg text-fg" : "bg-sunken text-fg-2")} aria-hidden="true">
                  <Icon className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <p className="text-[14px] font-semibold text-fg">
                      {service?.role ?? check.label}
                      {service && <span className="ml-2 text-[12.5px] font-normal text-fg-3">{check.label}</span>}
                    </p>
                    <Status tone={check.ok ? "pos" : "warn"}>{check.ok ? "Connected" : "Not connected"}</Status>
                  </div>
                  <p className="mt-0.5 text-[13px] text-fg-2">{service?.does ?? check.purpose}</p>
                  {!check.ok && (
                    <div className="mt-3 rounded-control bg-sunken px-3 py-2.5">
                      {service && (
                        <>
                          <p className="text-[12.5px] font-semibold text-fg">What to do</p>
                          <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[13px] text-fg-2">
                            {service.steps.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ol>
                        </>
                      )}
                      <p className={cn("text-[12.5px] text-fg-3", service && "mt-2.5")}>For whoever runs the engine, the {check.missing.length === 1 ? "setting" : "settings"} still to add:</p>
                      <p className="mt-1 flex flex-wrap gap-1.5">
                        {check.missing.map((name) => (
                          <code key={name} className="t-figure rounded-chip bg-surface px-1.5 py-0.5 text-[12px] break-all text-fg">
                            {name}
                          </code>
                        ))}
                      </p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div>
        <h2 className="t-eyebrow mb-2">How calls reach people</h2>
        <div className="space-y-4">
          <Panel title="Outbound calls" hint="outbound" description="Calls the agent places to the leads of a campaign.">
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
            <Link href="/dashboard/campaigns" className="mt-2 inline-block text-[13px] font-medium text-accent hover:underline">
              Open campaigns
            </Link>
          </Panel>

          <Panel title="Inbound calls" hint="inbound" description="Calls people make to one of your numbers, answered by the agent with a campaign's playbook.">
            {data.inbound_webhook ? (
              <div className="space-y-3">
                <ol className="list-decimal space-y-1.5 pl-5 text-[13.5px] text-fg-2">
                  <li>In a campaign&apos;s Settings, enter the phone number it should answer.</li>
                  <li>At the phone provider, open that number and set &ldquo;A call comes in&rdquo; to the address below (HTTP POST).</li>
                </ol>
                <CopyField label="Address for inbound calls" value={data.inbound_webhook} />
              </div>
            ) : (
              <p className="text-[13.5px] text-fg-2">The engine needs its public address first (PUBLIC_BASE_URL, see above). The address to give the phone provider is shown here once it is set.</p>
            )}
          </Panel>
        </div>
      </div>

      <div>
        <h2 className="t-eyebrow mb-2">For whoever runs the engine</h2>
        <div className="space-y-4">
          <Panel title="Separation between organizations" description="Each customer organization sees only its own campaigns, leads, calls, documents and people.">
            <p className="text-[13.5px] text-fg-2" data-testid="isolation">
              {
                {
                  enforced: "Enforced twice: by the application on every request, and by the database itself (row-level security).",
                  bypassed: "Enforced by the application on every request. The database policies exist but do not bind the database role in use (a superuser, or one with BYPASSRLS): run the engine as an ordinary role to switch them on.",
                  missing: "Enforced by the application on every request. The database policies are missing: run the engine's database upgrade.",
                  unavailable: "Enforced by the application on every request. This engine runs on SQLite, which has no database-level policies: use PostgreSQL before adding a second organization.",
                }[data.row_level_security]
              }
            </p>
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
      </div>
    </div>
  );
}
