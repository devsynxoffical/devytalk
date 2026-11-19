import { describe, expect, it } from "vitest";
import type { Campaign, EngineStatus } from "@/lib/api/schemas";
import { launchSteps, nextStep } from "./launch";

const check = (key: string, ok: boolean) => ({ key, label: key, purpose: "", ok, missing: ok ? [] : [key.toUpperCase()] });
const status = (ok: number): EngineStatus => ({
  ready_for_calls: ok === 5,
  checks: ["model", "telephony", "stt", "tts", "public_url"].map((key, i) => check(key, i < ok)),
  from_number: null,
  inbound_webhook: null,
  languages: [],
  website_intake: false,
  row_level_security: "unavailable",
  default_timezone: "UTC",
});
const campaign = (name: string, leads: number, extra: Partial<Campaign> = {}): Campaign => ({ id: name.length, name, status: "ready", languages: ["en"], inbound_number: null, stop_reason: null, spend_usd: 0, budget_usd: null, readiness_score: 0, stats: { total: leads }, running: false, ...extra });

describe("the way to the first call", () => {
  it("starts with connecting the services, and says how many are connected", () => {
    const steps = launchSteps(status(1), [], null);
    expect(steps.map((s) => s.done)).toEqual([false, false, false, false]);
    expect(steps[0].text).toContain("1 of 5 services connected");
    expect(nextStep(steps)?.id).toBe("connect");
    expect(steps[1]).toMatchObject({ href: "/dashboard/campaigns/new", admin: true });
  });

  it("sends the lead import to the campaign that has none", () => {
    const steps = launchSteps(status(5), [campaign("Law firms & co", 0)], null);
    expect(steps.map((s) => s.done)).toEqual([true, true, false, false]);
    expect(steps[2]).toMatchObject({ action: "Import leads", href: "/dashboard/campaigns/Law%20firms%20%26%20co/leads" });
    expect(nextStep(steps)?.id).toBe("leads");
  });

  it("counts leads across campaigns and opens the campaign that has them", () => {
    const steps = launchSteps(status(5), [campaign("Empty", 0), campaign("With leads", 12)], null);
    expect(steps.map((s) => s.done)).toEqual([true, true, true, false]);
    expect(steps[2]).toMatchObject({ text: "12 leads in 1 campaign.", action: "Open leads", href: "/dashboard/campaigns/With%20leads/leads" });
    expect(nextStep(steps)?.id).toBe("call");
  });

  it("does not ask an inbound-only campaign for leads as if it were stuck", () => {
    const steps = launchSteps(status(5), [campaign("Front desk", 0, { inbound_number: "+14155550123" })], null);
    expect(steps[2].done).toBe(false);
    expect(steps[2].text).toContain("Not needed for a campaign that only answers calls");
  });

  it("is finished once a call has been placed or answered", () => {
    const steps = launchSteps(status(5), [campaign("Pilot", 3)], 1);
    expect(steps[3].text).toBe("1 call so far.");
    expect(nextStep(steps)).toBeNull();
  });

  it("keeps a missing service first even when calls were placed before", () => {
    const steps = launchSteps(status(4), [campaign("Pilot", 3)], 40);
    expect(nextStep(steps)?.id).toBe("connect");
  });
});
