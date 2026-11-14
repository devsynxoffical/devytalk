"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Check, Circle } from "lucide-react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { count, languageName } from "@/lib/api/format";
import { campaignSchema, languagesSchema, statusSchema, type Campaign } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";
import { useAccess } from "./access";
import { CopyField } from "./CopyField";
import { Banner, Button, Confirm, Field, Input, Panel, Select, Skeleton, Status, type Notice } from "./ui";

const failure = (error: unknown) => {
  const text = error instanceof ApiError ? error.message : "Something went wrong. Try again.";
  return text[0].toUpperCase() + text.slice(1);
};
const campaignHref = (name: string, section = "") => `/dashboard/campaigns/${encodeURIComponent(name)}${section}`;

/** Which languages the agent opens in and switches to. */
export function LanguagesPanel({ campaign, onSaved }: { campaign: string; onSaved: (notice: Notice) => void }) {
  const { isAdmin } = useAccess();
  const { data, error, reload } = useApi(backendUrl(["campaigns", campaign, "languages"]), languagesSchema);
  const [opening, setOpening] = useState("");
  const [also, setAlso] = useState<string[]>([]);
  const [localize, setLocalize] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setOpening(data.languages[0] ?? "en");
    setAlso(data.languages.slice(1));
  }, [data]);

  if (error) return <Panel title="Languages">{<p className="text-[13px] text-crit" role="alert">{error.message}</p>}</Panel>;
  if (!data) return <Panel title="Languages">{<Skeleton className="h-9 w-64" />}</Panel>;

  const chosen = [opening, ...also.filter((code) => code !== opening)];
  const dirty = chosen.join() !== data.languages.join() || localize;
  const name = (code: string) => data.supported.find((l) => l.code === code)?.name ?? languageName(code);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setProblem(null);
    try {
      await apiRequest(backendUrl(["campaigns", campaign, "languages"]), languagesSchema, { method: "PUT", body: { languages: chosen, localize } });
      setLocalize(false);
      onSaved({ kind: "success", text: chosen.length === 1 ? `The agent now speaks ${name(chosen[0])} only.` : `The agent opens in ${name(chosen[0])} and switches to ${chosen.slice(1).map(name).join(" or ")} when the prospect speaks it.` });
      reload();
    } catch (e) {
      setProblem(failure(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Languages" description="The agent opens the call in one language and follows the prospect into the others.">
      <form onSubmit={save} className="space-y-4" noValidate>
        <fieldset disabled={!isAdmin} className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          <Field label="Opening language">
            <Select value={opening} onChange={(e) => setOpening(e.target.value)}>
              {data.supported.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <div>
            <p className="mb-1 text-[12.5px] font-medium text-fg-2" id="switch-label">
              Also switches to
            </p>
            <div role="group" aria-labelledby="switch-label" className="flex flex-wrap gap-1.5">
              {data.supported
                .filter((l) => l.code !== opening)
                .map((l) => {
                  const on = also.includes(l.code);
                  return (
                    <button
                      key={l.code}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setAlso(on ? also.filter((code) => code !== l.code) : [...also, l.code])}
                      className={cn("h-9 rounded-control border px-3 text-[13px] font-medium transition-colors disabled:opacity-60 max-sm:h-11", on ? "border-signal bg-signal text-on-signal" : "border-line-strong bg-surface text-fg-2 hover:border-fg-3")}
                    >
                      {l.name}
                    </button>
                  );
                })}
            </div>
          </div>
        </fieldset>

        {chosen.length > 1 && (
          <p className="t-meta max-w-2xl">
            {data.localized.length > 0 ? `Phrasing written for: ${data.localized.map(name).join(", ")}. ` : ""}
            In a language without its own phrasing the agent speaks from the {name(chosen[0])} playbook, translating as it goes.
          </p>
        )}
        {isAdmin && chosen.length > 1 && data.can_localize && (
          <label className="flex max-w-2xl items-start gap-2 text-[13px] text-fg-2">
            <input type="checkbox" checked={localize} onChange={(e) => setLocalize(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-signal)]" />
            <span>Have the AI model write native phrasing for the added languages now. This can take a minute.</span>
          </label>
        )}
        {data.provider_gaps.length > 0 && (
          <Banner tone="warn" title="The connected speech providers cannot handle every language chosen" role="status">
            <ul className="list-disc pl-4">
              {data.provider_gaps.map((gap) => (
                <li key={gap}>{gap[0].toUpperCase() + gap.slice(1)}.</li>
              ))}
            </ul>
            The campaign will not dial until this is resolved.
          </Banner>
        )}
        {problem && (
          <p className="text-[13px] font-medium text-crit" role="alert">
            {problem}
          </p>
        )}
        {isAdmin ? (
          <Button type="submit" variant="primary" busy={busy} disabled={!dirty}>
            Save languages
          </Button>
        ) : (
          <p className="t-meta">Only an admin can change the languages.</p>
        )}
      </form>
    </Panel>
  );
}

/** The phone number this campaign answers, and what to set at the phone provider. */
export function InboundPanel({ campaign, onSaved }: { campaign: string; onSaved: (notice: Notice) => void }) {
  const { isAdmin } = useAccess();
  const current = useApi(backendUrl(["campaigns", campaign]), campaignSchema);
  const status = useApi(backendUrl(["status"]), statusSchema);
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [stopping, setStopping] = useState(false);
  const answered = current.data?.inbound_number ?? null;

  async function send(value: string | null) {
    setBusy(true);
    setProblem(null);
    try {
      const saved = await apiRequest(backendUrl(["campaigns", campaign, "inbound"], { number: value }), campaignSchema, { method: "POST" });
      setNumber("");
      setStopping(false);
      onSaved({ kind: "success", text: saved.inbound_number ? `Calls to ${saved.inbound_number} are answered with this campaign's playbook.` : "This campaign no longer answers inbound calls." });
      current.reload();
    } catch (e) {
      setProblem(failure(e));
    } finally {
      setBusy(false);
    }
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (number.replace(/\D/g, "").length < 6) return setProblem("Enter the full phone number, with its country code.");
    void send(number.trim());
  }

  return (
    <Panel title="Inbound calls" description="When someone calls this number, the agent answers with this campaign's playbook and languages.">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2" data-testid="inbound-state">
          {current.data ? (
            answered ? (
              <>
                <Status tone="pos">Answering</Status>
                <span className="t-figure text-[14px] font-medium text-fg">{answered}</span>
              </>
            ) : (
              <Status tone="neutral">Not answering inbound calls</Status>
            )
          ) : (
            <Skeleton className="h-5 w-48" />
          )}
        </div>

        {isAdmin ? (
          stopping && answered ? (
            <Confirm label="Stop answering inbound calls" confirmLabel="Stop answering" tone="danger" busy={busy} error={problem} onConfirm={() => send(null)} onCancel={() => (setStopping(false), setProblem(null))}>
              Stop answering calls to <strong className="t-figure font-semibold text-fg">{answered}</strong>? Callers will hear that no agent is available. Outbound dialing is not affected.
            </Confirm>
          ) : (
            <form onSubmit={save} className="flex flex-wrap items-end gap-3" noValidate>
              <Field label={answered ? "Answer a different number" : "Phone number to answer"} error={problem} className="min-w-48 flex-1 sm:max-w-xs">
                <Input type="tel" inputMode="tel" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+14155550123" autoComplete="off" className="t-figure" />
              </Field>
              <Button type="submit" variant="primary" busy={busy} disabled={!number.trim()}>
                {answered ? "Change number" : "Answer this number"}
              </Button>
              {answered && (
                <Button variant="danger" onClick={() => (setProblem(null), setStopping(true))}>
                  Stop answering
                </Button>
              )}
            </form>
          )
        ) : (
          <p className="t-meta">Only an admin can change the inbound number.</p>
        )}

        {status.data &&
          (status.data.inbound_webhook ? (
            <div className="max-w-2xl space-y-2">
              <p className="text-[13px] text-fg-2">At the phone provider, set this number&apos;s &ldquo;A call comes in&rdquo; to the address below (HTTP POST). Until then calls to the number do not reach the agent.</p>
              <CopyField label="Address for inbound calls" value={status.data.inbound_webhook} />
            </div>
          ) : (
            <Banner tone="warn" title="The engine has no public address yet" role="status">
              Inbound calls cannot reach it until PUBLIC_BASE_URL is set.{" "}
              <Link href="/dashboard/setup" className="font-medium text-accent hover:underline">
                Open Setup
              </Link>
            </Banner>
          ))}
      </div>
    </Panel>
  );
}

/** For a campaign that has not placed or answered a call yet: what is done and what comes next. */
export function GettingStarted({ campaign }: { campaign: Campaign }) {
  const status = useApi(backendUrl(["status"]), statusSchema);
  const leads = campaign.stats.total ?? 0;
  const ready = status.data?.ready_for_calls;
  const steps: { done: boolean | undefined; title: string; text: string; href: string; action: string }[] = [
    { done: true, title: "The agent has a playbook", text: `It speaks ${campaign.languages.map(languageName).join(", ") || "one language"}. Review what it will say, or improve it from your documents.`, href: campaignHref(campaign.name, "/playbook"), action: "Review playbook" },
    { done: leads > 0, title: leads > 0 ? `${count(leads)} ${leads === 1 ? "lead" : "leads"} to call` : "Import the people to call", text: "A CSV or Excel sheet with a phone column. Needed for outbound calls only.", href: campaignHref(campaign.name, "/leads"), action: leads > 0 ? "Open leads" : "Import leads" },
    { done: undefined, title: "Give the agent your documents (optional)", text: "Price lists, product sheets and FAQs it can look facts up in during a call.", href: campaignHref(campaign.name, "/knowledge"), action: "Add documents" },
    { done: undefined, title: "Check the calling rules", text: "Days and hours, attempts per lead, daily limits and budget. For inbound calls, the number to answer.", href: campaignHref(campaign.name, "/settings"), action: "Open settings" },
    { done: ready, title: ready ? "Phone, speech and AI providers are connected" : "Connect the phone, speech and AI providers", text: ready ? "The engine can place and answer calls." : "Until then the campaign can be prepared but not started.", href: "/dashboard/setup", action: "Open setup" },
  ];
  return (
    <Panel title="Getting this campaign ready" description="No call has been placed or answered yet. When everything is in place, choose Start dialing above, or let the agent answer your inbound number." flush>
      <ol className="divide-y divide-line" data-testid="getting-started">
        {steps.map((step) => (
          <li key={step.title} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
            <span
              className={cn("grid size-5 shrink-0 place-items-center rounded-full", step.done ? "bg-signal text-on-signal" : step.done === false ? "bg-warn-mark text-white" : "border border-line-strong text-fg-3")}
              aria-label={step.done ? "Done" : step.done === false ? "To do" : "Optional or to check"}
              role="img"
            >
              {step.done ? <Check className="size-3" aria-hidden="true" /> : <Circle className="size-2" aria-hidden="true" />}
            </span>
            <div className="min-w-0 flex-1 basis-56">
              <p className="text-[13.5px] font-medium text-fg">{step.title}</p>
              <p className="t-meta mt-0.5">{step.text}</p>
            </div>
            <Link href={step.href} className="shrink-0 text-[13px] font-medium text-accent hover:underline">
              {step.action}
            </Link>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/** Shown on the overview while real calls are not possible yet. */
export function ConnectionsBanner() {
  const { data } = useApi(backendUrl(["status"]), statusSchema);
  if (!data || data.ready_for_calls) return null;
  const missing = data.checks.filter((c) => !c.ok).length;
  return (
    <Banner
      tone="warn"
      role="status"
      testId="connections-banner"
      title="Calls cannot be placed or answered yet"
      actions={
        <Link href="/dashboard/setup" className="shrink-0 text-[13px] font-medium text-accent hover:underline">
          Open setup
        </Link>
      }
    >
      {missing} of {data.checks.length} connections to the phone, speech and AI providers are missing on the calling engine.
    </Banner>
  );
}
