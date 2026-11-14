import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const lead = { kind: "demo" as const, email: "ada@example.com", name: "Ada", company: "Northwind", phone: undefined, teamSize: "6-20" as const, message: "Show me the dialer." };
let dir: string;

async function store() {
  vi.resetModules(); // the module reads its settings when it loads
  return import("./lead-store");
}
const kept = () => readFileSync(join(dir, "leads.ndjson"), "utf8").trim().split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "leads-"));
  vi.stubEnv("LEADS_DIR", dir);
  vi.stubEnv("DEVYTALK_API_URL", "http://engine.test");
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("saveLead", () => {
  it("hands the request to the calling engine with the intake token", async () => {
    vi.stubEnv("DEVYTALK_INTAKE_TOKEN", "intake-secret");
    const send = vi.fn(async () => new Response(JSON.stringify({ id: 42 }), { status: 201 }));
    const { saveLead } = await store();

    expect(await saveLead(lead, {}, send as unknown as typeof fetch)).toBe("42");
    const [url, init] = send.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://engine.test/api/intake/requests");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer intake-secret");
    expect(JSON.parse(init.body as string)).toEqual({ kind: "demo", email: "ada@example.com", name: "Ada", company: "Northwind", team_size: "6-20", message: "Show me the dialer." });
    expect(() => kept()).toThrow(); // nothing written to disk
  });

  it.each([
    ["the engine refuses it", async () => new Response("{}", { status: 401 })],
    ["the engine cannot be reached", async () => Promise.reject(new Error("connection refused"))],
  ])("keeps the request on disk when %s, so it is never dropped", async (_case, answer) => {
    vi.stubEnv("DEVYTALK_INTAKE_TOKEN", "intake-secret");
    const { saveLead } = await store();
    const id = await saveLead(lead, { userAgent: "test" }, answer as unknown as typeof fetch);
    expect(kept()).toMatchObject([{ id, kind: "demo", email: "ada@example.com" }]);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("intake-secret"); // the token is never logged
  });

  it("keeps requests on disk, and says so, while no intake token is set", async () => {
    const send = vi.fn();
    const { saveLead } = await store();
    await saveLead(lead, {}, send as unknown as typeof fetch);
    expect(send).not.toHaveBeenCalled();
    expect(kept()).toHaveLength(1);
    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain("DEVYTALK_INTAKE_TOKEN is not set");
  });
});
