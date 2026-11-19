"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Check, Pause, Play, TriangleAlert } from "lucide-react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { count, languageName } from "@/lib/api/format";
import { campaignSchema, rulesSchema, statusSchema } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";
import { campaignTone } from "./Shell";
import { Hint } from "./Hint";
import { useAccess } from "./access";
import { startChecks } from "./start-checks";
import { Button, Confirm, Skeleton, Status } from "./ui";

const TABS = [
  { segment: "", label: "Performance" },
  { segment: "/leads", label: "Leads" },
  { segment: "/calls", label: "Calls" },
  { segment: "/knowledge", label: "Knowledge" },
  { segment: "/playbook", label: "Coach & playbook" },
  { segment: "/experiments", label: "A/B tests" },
  { segment: "/settings", label: "Settings" },
];

/** The campaign's identity, its state, the one control that matters (start or pause dialing), and its sections. */
export function CampaignHeader({ name }: { name: string }) {
  const pathname = usePathname();
  const base = `/dashboard/campaigns/${encodeURIComponent(name)}`;
  const { data, reload } = useApi(backendUrl(["campaigns", name]), campaignSchema);
  const { canOperate } = useAccess();
  const [asking, setAsking] = useState<"start" | "pause" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Loaded only once the person asks to start: what they should know before real calls go out.
  const status = useApi(asking === "start" ? backendUrl(["status"]) : null, statusSchema);
  const rules = useApi(asking === "start" ? backendUrl(["campaigns", name, "rules"]) : null, rulesSchema);
  const checks = data && status.data && rules.data ? startChecks(data, status.data, rules.data) : null;

  async function run(action: "start" | "pause") {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(backendUrl(["campaigns", name, action]), campaignSchema, { method: "POST" });
      setAsking(null);
      reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const state = data ? campaignTone(data) : null;
  return (
    <div className="-mx-4 -mt-5 border-b border-line bg-surface px-4 pt-5 sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="t-title truncate text-fg">{name}</h1>
          <div className="mt-1.5 flex min-h-5 flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-fg-3">
            {data && state ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Status tone={state.tone} live={state.live}>
                    {state.text}
                  </Status>
                  {data.stop_reason && !data.running && <Hint term="paused-itself" />}
                </span>
                <span>
                  <span className="t-figure text-fg-2">{count(data.stats.total ?? 0)}</span> leads
                </span>
                {data.languages.length > 0 && <span>{data.languages.map(languageName).join(", ")}</span>}
                {data.inbound_number && (
                  <span>
                    Answers <span className="t-figure text-fg-2">{data.inbound_number}</span>
                  </span>
                )}
              </>
            ) : (
              <Skeleton className="w-40" />
            )}
          </div>
        </div>
        {data && asking === null && canOperate && (
          <div className="flex gap-2">
            {data.running ? (
              <Button onClick={() => setAsking("pause")}>
                <Pause className="size-3.5" aria-hidden="true" /> Pause dialing
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setAsking("start")}>
                <Play className="size-3.5" aria-hidden="true" /> Start dialing
              </Button>
            )}
          </div>
        )}
      </div>

      {asking && (
        <div className="mt-3 max-w-xl">
          <Confirm
            label={asking === "start" ? "Confirm starting" : "Confirm pausing"}
            confirmLabel={asking === "start" ? "Yes, start dialing" : "Yes, pause dialing"}
            busy={busy}
            error={error}
            onConfirm={() => run(asking)}
            onCancel={() => {
              setAsking(null);
              setError(null);
            }}
          >
            {asking === "start" ? (
              <>
                <p>The engine will start placing real phone calls to leads that are due, inside this campaign&apos;s calling days, hours and budget.</p>
                {checks && (
                  <ul className="mt-2.5 space-y-1.5" data-testid="start-checks">
                    {checks.map((check) => (
                      <li key={check.id} className="flex items-start gap-2">
                        {check.ok ? <Check className="mt-0.5 size-3.5 shrink-0 text-accent" aria-label="Ready" /> : <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warn-mark" aria-label="Needs attention" />}
                        <span className={check.ok ? undefined : "font-medium text-fg"}>
                          {check.text}
                          {check.fix && (
                            <>
                              {" "}
                              <Link href={check.fix.href} className="font-medium text-accent hover:underline">
                                {check.fix.label}
                              </Link>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              "No new calls will be placed. Calls already in progress finish normally."
            )}
          </Confirm>
        </div>
      )}

      {/* On a phone the sections scroll sideways; the fading edge says there is more. */}
      <nav aria-label="Campaign sections" className="-mx-4 mt-4 overflow-x-auto px-4 [scrollbar-width:none] max-md:[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] sm:-mx-6 sm:px-6">
        <ul className="flex gap-5 max-md:pr-8">
          {TABS.map((tab) => {
            const href = base + tab.segment;
            const active = decodeURIComponent(pathname) === decodeURIComponent(href);
            return (
              <li key={tab.label}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn("relative block whitespace-nowrap pb-2.5 pt-1 text-[13.5px] transition-colors", active ? "font-medium text-fg" : "text-fg-3 hover:text-fg")}
                >
                  {tab.label}
                  {active && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t bg-signal" aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
