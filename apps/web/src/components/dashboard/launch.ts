import type { Campaign, EngineStatus } from "@/lib/api/schemas";

/**
 * The way from a new account to the first call, worked out from what the engine
 * already reports. Nothing is remembered in the browser: a step is done when the
 * thing it asks for exists.
 */
export type LaunchStep = {
  id: "connect" | "campaign" | "leads" | "call";
  title: string;
  text: string;
  done: boolean;
  href: string;
  action: string;
  /** Only an admin can do this one from the console. */
  admin?: boolean;
};

const campaignHref = (name: string, section = "") => `/dashboard/campaigns/${encodeURIComponent(name)}${section}`;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** `calls` is the number of calls placed or answered so far, or null while that is not known. */
export function launchSteps(status: EngineStatus, campaigns: Campaign[], calls: number | null): LaunchStep[] {
  const connected = status.checks.filter((check) => check.ok).length;
  const withLeads = campaigns.filter((c) => (c.stats.total ?? 0) > 0);
  const leads = withLeads.reduce((sum, c) => sum + (c.stats.total ?? 0), 0);
  const first = campaigns[0];
  const waiting = campaigns.find((c) => (c.stats.total ?? 0) === 0) ?? first;
  // Where the leads are once there are some; until then, where they are still missing.
  const leadsAt = withLeads[0] ?? waiting;
  const answering = campaigns.some((c) => c.inbound_number);
  return [
    {
      id: "connect",
      title: "Connect the services a call needs",
      text: status.ready_for_calls ? "The phone line, speech recognition, AI model and voice are connected." : `${connected} of ${status.checks.length} services connected. Setup shows what is missing, in plain words.`,
      done: status.ready_for_calls,
      href: "/dashboard/setup",
      action: "Open setup",
    },
    {
      id: "campaign",
      title: "Create a campaign",
      text: campaigns.length > 0 ? `${plural(campaigns.length, "campaign")} so far. Each has its own playbook: what the agent says.` : "Say who the agent calls and what it offers. It starts from exactly what you write.",
      done: campaigns.length > 0,
      href: campaigns.length > 0 ? "/dashboard/campaigns" : "/dashboard/campaigns/new",
      action: campaigns.length > 0 ? "Open campaigns" : "Create a campaign",
      admin: campaigns.length === 0,
    },
    {
      id: "leads",
      title: "Add the people to call",
      text: leads > 0 ? `${plural(leads, "lead")} in ${plural(withLeads.length, "campaign")}.` : answering ? "Not needed for a campaign that only answers calls. For outbound calls, import a sheet with a phone column." : "Import a CSV or Excel sheet with a phone column into a campaign.",
      done: leads > 0,
      href: leadsAt ? campaignHref(leadsAt.name, "/leads") : "/dashboard/campaigns",
      action: leads > 0 ? "Open leads" : "Import leads",
    },
    {
      id: "call",
      title: "Place the first call",
      text: calls ? `${plural(calls, "call")} so far.` : "Open a campaign, check its calling days, hours and budget, then choose Start dialing.",
      done: Boolean(calls),
      href: first ? campaignHref(first.name, calls ? "/calls" : "") : "/dashboard/campaigns",
      action: calls ? "See the calls" : "Open the campaign",
    },
  ];
}

/** The first step still to do, or null when the account is up and calling. */
export function nextStep(steps: LaunchStep[]): LaunchStep | null {
  return steps.find((step) => !step.done) ?? null;
}
