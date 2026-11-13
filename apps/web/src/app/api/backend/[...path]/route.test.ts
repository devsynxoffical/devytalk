import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

let sessionToken: string | undefined;
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "dt_session" && sessionToken ? { name, value: sessionToken } : undefined) }),
}));

import { GET, POST } from "./route";

const context = (...path: string[]) => ({ params: Promise.resolve({ path }) });
const upstream = vi.fn();

function request(url: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
  return new NextRequest(`http://localhost:3000${url}`, init);
}

beforeEach(() => {
  sessionToken = "operator-token-123";
  upstream.mockReset();
  upstream.mockResolvedValue(new Response(JSON.stringify([{ id: 1 }]), { status: 200, headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", upstream);
});
afterEach(() => vi.unstubAllGlobals());

describe("dashboard proxy to the calling engine", () => {
  it("refuses a visitor who is not signed in, without calling the engine", async () => {
    sessionToken = undefined;
    const response = await GET(request("/api/backend/campaigns"), context("campaigns"));
    expect(response.status).toBe(401);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("adds the operator's token on the server and never returns it to the browser", async () => {
    const response = await GET(request("/api/backend/campaigns/a/leads?category=hot"), context("campaigns", "a", "leads"));
    expect(response.status).toBe(200);
    const [url, init] = upstream.mock.calls[0];
    expect(url).toBe("http://localhost:8000/api/campaigns/a/leads?category=hot");
    expect(init.headers.Authorization).toBe("Bearer operator-token-123");
    const text = await response.text();
    expect(text).not.toContain("operator-token-123");
    expect([...response.headers.values()].join(" ")).not.toContain("operator-token-123");
  });

  it("refuses a change started by another website", async () => {
    const response = await POST(
      request("/api/backend/campaigns/a/versions/3/approve", { method: "POST", headers: { origin: "https://evil.test", host: "localhost:3000" }, body: "{}" }),
      context("campaigns", "a", "versions", "3", "approve"),
    );
    expect(response.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("forwards a change started by the dashboard itself, body included", async () => {
    upstream.mockResolvedValue(new Response(JSON.stringify({ version: 3 }), { status: 200 }));
    const response = await POST(
      request("/api/backend/campaigns/a/versions/3/approve", { method: "POST", headers: { origin: "http://localhost:3000", host: "localhost:3000" }, body: '{"approved_by":"dashboard"}' }),
      context("campaigns", "a", "versions", "3", "approve"),
    );
    expect(response.status).toBe(200);
    const [url, init] = upstream.mock.calls[0];
    expect(url).toBe("http://localhost:8000/api/campaigns/a/versions/3/approve");
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"approved_by":"dashboard"}');
  });

  it("cannot be pointed outside the engine's /api", async () => {
    const response = await GET(request("/api/backend/x"), context("..", "twilio", "voice"));
    expect(response.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("ends the session when the engine no longer accepts the token", async () => {
    upstream.mockResolvedValue(new Response(JSON.stringify({ detail: "missing or invalid API token" }), { status: 401 }));
    const response = await GET(request("/api/backend/campaigns"), context("campaigns"));
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toMatch(/dt_session=;/);
  });

  it("passes the engine's refusals through with their explanation", async () => {
    upstream.mockResolvedValue(new Response(JSON.stringify({ detail: "version 4 still has blocking open questions" }), { status: 400, headers: { "content-type": "application/json" } }));
    const response = await POST(
      request("/api/backend/campaigns/a/versions/4/approve", { method: "POST", headers: { origin: "http://localhost:3000", host: "localhost:3000" } }),
      context("campaigns", "a", "versions", "4", "approve"),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ detail: "version 4 still has blocking open questions" });
  });

  it("says so when the engine is down", async () => {
    upstream.mockRejectedValue(new TypeError("fetch failed"));
    const response = await GET(request("/api/backend/campaigns"), context("campaigns"));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ detail: "The calling engine could not be reached." });
  });
});
