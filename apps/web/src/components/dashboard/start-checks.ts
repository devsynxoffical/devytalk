import { count, money } from "@/lib/api/format";
import type { Campaign, EngineStatus, Rules } from "@/lib/api/schemas";

/**
 * What a person should know before a campaign starts dialing, from what the engine
 * already reports. These are a courtesy: the engine makes its own checks when asked to
 * start, and its answer is the one that counts.
 */
export type StartCheck = { id: "services" | "leads" | "window" | "budget"; ok: boolean; text: string; fix?: { label: string; href: string } };

const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_NAME: Record<string, string> = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };

/** "Monday to Saturday", "every day", or the days listed when they do not form one run. */
export function daySpan(days: string[]): string {
  const chosen = WEEK.filter((d) => days.includes(d));
  if (chosen.length === 0) return "no day";
  if (chosen.length === 7) return "every day";
  const first = WEEK.indexOf(chosen[0]);
  const run = chosen.every((d, i) => WEEK.indexOf(d) === first + i);
  if (run && chosen.length >= 3) return `${DAY_NAME[chosen[0]]} to ${DAY_NAME[chosen[chosen.length - 1]]}`;
  const names = chosen.map((d) => DAY_NAME[d]);
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function startChecks(campaign: Campaign, status: EngineStatus, rules: Rules): StartCheck[] {
  const base = `/dashboard/campaigns/${encodeURIComponent(campaign.name)}`;
  const missing = status.checks.filter((check) => !check.ok).length;
  const waiting = (campaign.stats.pending ?? 0) + (campaign.stats.callback ?? 0);
  const total = campaign.stats.total ?? 0;
  const r = rules.rules;
  const left = r.budget_usd === null ? null : Math.max(0, r.budget_usd - rules.spend_usd);
  return [
    status.ready_for_calls
      ? { id: "services", ok: true, text: "The phone line, speech recognition, AI model and voice are connected." }
      : { id: "services", ok: false, text: `${missing} of ${status.checks.length} services are not connected yet, so the engine will refuse to start.`, fix: { label: "Open setup", href: "/dashboard/setup" } },
    waiting > 0
      ? { id: "leads", ok: true, text: `${count(waiting)} ${waiting === 1 ? "lead is" : "leads are"} waiting to be called.` }
      : { id: "leads", ok: false, text: total === 0 ? "This campaign has no leads yet, so there is nobody to call." : "Every lead here has been called or is finished, so there is nobody left to call.", fix: { label: "Import leads", href: `${base}/leads` } },
    { id: "window", ok: true, text: `Calls go out ${daySpan(r.calling_days)}, between ${r.window_start} and ${r.window_end} in each lead's own time zone.` },
    left === null
      ? { id: "budget", ok: true, text: "No budget is set, so the campaign will not stop on spend." }
      : left > 0
        ? { id: "budget", ok: true, text: `${money(left)} of the ${money(r.budget_usd)} budget is left. Dialing pauses itself when it is spent.` }
        : { id: "budget", ok: false, text: `The ${money(r.budget_usd)} budget is spent, so no call will be placed.`, fix: { label: "Raise the budget", href: `${base}/settings` } },
  ];
}
