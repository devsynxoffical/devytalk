import { describe, expect, it } from "vitest";
import type { Campaign, EngineStatus, Rules } from "@/lib/api/schemas";
import { daySpan, startChecks } from "./start-checks";

const status = (ready: boolean): EngineStatus => ({
  ready_for_calls: ready,
  checks: [
    { key: "model", label: "AI model", purpose: "", ok: ready, missing: ready ? [] : ["ANTHROPIC_API_KEY"] },
    { key: "telephony", label: "Phone", purpose: "", ok: true, missing: [] },
  ],
  from_number: null, inbound_webhook: null, languages: [], website_intake: false, row_level_security: "unavailable", default_timezone: "UTC",
});
const campaign = (stats: Record<string, number>): Campaign => ({ id: 1, name: "Dental & co", status: "ready", languages: ["en"], inbound_number: null, stop_reason: null, spend_usd: 0, budget_usd: null, readiness_score: 0, stats, running: false });
const rules = (budget: number | null, spend = 0, days = ["mon", "tue", "wed", "thu", "fri", "sat"]): Rules => ({
  rules: { calling_days: days, window_start: "09:00", window_end: "19:00", max_attempts: 3, retry_delay_minutes: 240, max_calls_per_day: null, max_calls_per_month: null, budget_usd: budget, starts_at: null, ends_at: null, stop_after_meetings: null, max_opt_out_rate: null, require_consent: false },
  stored: {}, spend_usd: spend, stop_reason: null,
});

describe("calling days in words", () => {
  it("names a run of days by its ends", () => expect(daySpan(["sat", "mon", "tue", "wed", "thu", "fri"])).toBe("Monday to Saturday"));
  it("says every day for all seven", () => expect(daySpan(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).toBe("every day"));
  it("lists days that do not form one run", () => expect(daySpan(["mon", "wed", "fri"])).toBe("Monday, Wednesday and Friday"));
  it("lists two days", () => expect(daySpan(["sat", "sun"])).toBe("Saturday and Sunday"));
});

describe("before a campaign starts dialing", () => {
  it("passes when services are connected, leads are waiting and budget is left", () => {
    const checks = startChecks(campaign({ total: 80, pending: 17, callback: 1 }), status(true), rules(50, 32.05));
    expect(checks.map((c) => c.ok)).toEqual([true, true, true, true]);
    expect(checks[1].text).toBe("18 leads are waiting to be called.");
    expect(checks[2].text).toBe("Calls go out Monday to Saturday, between 09:00 and 19:00 in each lead's own time zone.");
    expect(checks[3].text).toContain("$17.95 of the $50.00 budget is left");
  });

  it("says the engine will refuse while a service is missing, and where to fix it", () => {
    const [services] = startChecks(campaign({ total: 5, pending: 5 }), status(false), rules(null));
    expect(services).toMatchObject({ ok: false, text: "1 of 2 services are not connected yet, so the engine will refuse to start.", fix: { href: "/dashboard/setup" } });
  });

  it("tells a campaign with no leads from one whose leads are all done", () => {
    expect(startChecks(campaign({ total: 0 }), status(true), rules(null))[1]).toMatchObject({ ok: false, text: "This campaign has no leads yet, so there is nobody to call.", fix: { href: "/dashboard/campaigns/Dental%20%26%20co/leads" } });
    expect(startChecks(campaign({ total: 90, completed: 90 }), status(true), rules(null))[1].text).toContain("Every lead here has been called or is finished");
  });

  it("flags a spent budget and points to the setting", () => {
    expect(startChecks(campaign({ total: 80, pending: 18 }), status(true), rules(32, 32.05))[3]).toMatchObject({ ok: false, text: "The $32.00 budget is spent, so no call will be placed.", fix: { label: "Raise the budget", href: "/dashboard/campaigns/Dental%20%26%20co/settings" } });
  });
});
