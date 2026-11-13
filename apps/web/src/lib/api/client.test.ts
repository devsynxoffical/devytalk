import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, apiRequest, backendUrl, errorMessage } from "./client";
import { experimentSchema, leadListSchema, reportSchema, versionSchema } from "./schemas";

const schema = z.object({ total: z.number() });

function respond(status: number, body: unknown) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(body === null ? null : JSON.stringify(body), { status })));
}

afterEach(() => vi.unstubAllGlobals());

describe("backendUrl", () => {
  it("escapes every path segment, so a campaign name cannot change the route", () => {
    expect(backendUrl(["campaigns", "Q4 / EMEA?x=1", "report"])).toBe("/api/backend/campaigns/Q4%20%2F%20EMEA%3Fx%3D1/report");
    expect(backendUrl(["campaigns", "../admin"])).toBe("/api/backend/campaigns/..%2Fadmin");
  });

  it("leaves out empty filters", () => {
    expect(backendUrl(["campaigns", "a", "leads"], { category: "hot", status: "", q: undefined, min_score: null, offset: 0 })).toBe(
      "/api/backend/campaigns/a/leads?category=hot&offset=0",
    );
  });
});

describe("errorMessage", () => {
  it("uses the engine's own explanation when there is one", () => {
    expect(errorMessage({ detail: "only 3 reviewed calls so far" }, 409)).toBe("only 3 reviewed calls so far");
    expect(errorMessage({ detail: [{ msg: "Input should be greater than or equal to 30" }] }, 422)).toBe("Input should be greater than or equal to 30");
  });

  it("falls back to a plain sentence", () => {
    expect(errorMessage(null, 502)).toBe("The calling engine could not be reached.");
    expect(errorMessage("<html>", 500)).toBe("The request failed (500).");
  });
});

describe("apiRequest", () => {
  it("returns data that has the expected shape", async () => {
    respond(200, { total: 4 });
    await expect(apiRequest("/api/backend/x", schema)).resolves.toEqual({ total: 4 });
  });

  it("refuses data of the wrong shape instead of handing it to a page", async () => {
    respond(200, { total: "four" });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(apiRequest("/api/backend/x", schema)).rejects.toThrow(/does not understand/);
    error.mockRestore();
  });

  it("passes the engine's error text on", async () => {
    respond(409, { detail: "this campaign already has a test running; stop it before starting another" });
    await expect(apiRequest("/api/backend/x", schema, { method: "POST", body: {} })).rejects.toMatchObject({ status: 409, message: expect.stringContaining("already has a test running") });
  });

  it("reports a lost connection", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    await expect(apiRequest("/api/backend/x", schema)).rejects.toBeInstanceOf(ApiError);
  });

  it("sends the person back to sign-in when the session has ended", async () => {
    respond(401, { detail: "Sign in to continue." });
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { pathname: "/dashboard/campaigns/a", assign } });
    await expect(apiRequest("/api/backend/x", schema)).rejects.toMatchObject({ status: 401 });
    expect(assign).toHaveBeenCalledWith("/login?next=%2Fdashboard%2Fcampaigns%2Fa");
  });
});

describe("response schemas", () => {
  const arm = { version: 1, leads_dialed: 0, leads_answered: 0, conversions: 0, conversion_rate: null, calls: 0, average_quality: null, answered_needed: 30 };
  const experiment = {
    id: 1, name: "t", status: "running", variant_share: 0.5, min_answered_per_arm: 30, started_at: null, ended_at: null, created_by: "",
    control: arm, variant: { ...arm, version: 2 }, enough_data: false, p_value: null, verdict: "collecting", leader: null, summary: "Still collecting",
  };

  it("accept an A/B test with no calls yet: rates are null, not zero", () => {
    const parsed = experimentSchema.parse(experiment);
    expect(parsed.control.conversion_rate).toBeNull();
    expect(parsed.leader).toBeNull();
  });

  it("reject a verdict the dashboard does not know how to explain", () => {
    expect(experimentSchema.safeParse({ ...experiment, verdict: "winner" }).success).toBe(false);
  });

  it("reject a report with a missing section", () => {
    expect(reportSchema.safeParse({ campaign: "a", calls: { total: 1 } }).success).toBe(false);
  });

  it("accept an empty lead list and a lead nobody has called", () => {
    expect(leadListSchema.parse({ total: 0, limit: 25, offset: 0, leads: [] }).leads).toEqual([]);
    const lead = {
      id: 1, name: "", company: "", phone: "+14155550100", status: "pending", priority: 0, attempts: 0, last_disposition: null, score: null,
      category: "unscored", calls: 0, buying_intent_score: null, buying_intent: null, next_action: null, sentiment: null, lost_reason: null,
      objections: [], pain_points: [],
    };
    const parsed = leadListSchema.parse({ total: 1, limit: 25, offset: 0, leads: [lead] });
    expect(parsed.leads[0].evidence).toEqual({});
    expect(parsed.leads[0].points).toEqual({});
  });

  it("only know the four version states", () => {
    const version = { version: 3, status: "draft", source: "coach", note: "", created_by: "coach", approved_by: "", created_at: null, activated_at: null, readiness_score: 90, blocking_questions: [], open_questions: 0 };
    expect(versionSchema.parse(version).changes).toEqual([]);
    expect(versionSchema.safeParse({ ...version, status: "published" }).success).toBe(false);
  });
});
