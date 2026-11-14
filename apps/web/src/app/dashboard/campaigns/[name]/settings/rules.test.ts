import { describe, expect, it } from "vitest";
import { buildRules } from "./page";

const form = { days: ["mon", "tue", "wed", "thu", "fri"], start: "09:00", end: "18:00", attempts: "3", retry: "240", perDay: "", perMonth: "", budget: "", meetings: "", optOut: "" };

describe("calling rules form", () => {
  it("sends weekday numbers and leaves out limits that were left empty", () => {
    const { body, errors } = buildRules(form, {});
    expect(errors).toEqual({});
    expect(body).toEqual({ calling_days: [0, 1, 2, 3, 4], window_start: "09:00", window_end: "18:00", max_attempts: 3, retry_delay_minutes: 240 });
  });

  it("keeps stored settings the form does not show, and removes a limit that was cleared", () => {
    const stored = { scoring_weights: { has_need: 40 }, ends_at: "2027-01-01T00:00:00Z", budget_usd: 32, max_calls_per_day: 200 };
    const { body } = buildRules({ ...form, perDay: "150" }, stored);
    expect(body).toMatchObject({ scoring_weights: { has_need: 40 }, ends_at: "2027-01-01T00:00:00Z", max_calls_per_day: 150 });
    expect(body).not.toHaveProperty("budget_usd"); // the budget field was emptied: back to "no budget"
  });

  it("turns the opt-out percentage into a share and money into a number", () => {
    const { body } = buildRules({ ...form, optOut: "5", budget: "250.50", meetings: "40" }, {});
    expect(body).toMatchObject({ max_opt_out_rate: 0.05, budget_usd: 250.5, stop_after_meetings: 40 });
  });

  it("refuses what the engine would refuse, in words", () => {
    const { body, errors } = buildRules({ ...form, days: [], start: "19:00", end: "09:00", attempts: "0", retry: "2", budget: "-5", optOut: "140" }, {});
    expect(body).toBeUndefined();
    expect(errors).toMatchObject({ days: "Choose at least one day.", end: "Must be later than the start.", attempts: "A whole number from 1 to 10.", budget: expect.stringContaining("above zero") });
    expect(errors.retry).toBeDefined();
    expect(errors.optOut).toBeDefined();
  });
});
