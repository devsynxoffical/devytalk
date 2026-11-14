import { describe, expect, it } from "vitest";
import { enginePath, isSameOrigin, sessionCookieOptions } from "./backend";

describe("enginePath", () => {
  it("maps dashboard paths onto the engine's /api only", () => {
    expect(enginePath(["campaigns"])).toBe("/api/campaigns");
    expect(enginePath(["campaigns", "Accounting firms Q4", "leads", "7"])).toBe("/api/campaigns/Accounting%20firms%20Q4/leads/7");
  });

  it("refuses anything that could leave /api", () => {
    expect(enginePath([])).toBeNull();
    expect(enginePath(["..", "twilio", "voice"])).toBeNull();
    expect(enginePath(["campaigns", "."])).toBeNull();
    expect(enginePath(["campaigns", "a/../../ws"])).toBeNull();
    expect(enginePath(["campaigns", "a\\b"])).toBeNull();
    expect(enginePath(["campaigns", ""])).toBeNull();
  });

  it("does not let page scripts sign in through the proxy and read the session token", () => {
    expect(enginePath(["auth", "login"])).toBeNull();
    expect(enginePath(["auth", "me"])).toBe("/api/auth/me");
    expect(enginePath(Array(13).fill("a"))).toBeNull();
  });
});

describe("isSameOrigin", () => {
  const request = (headers: Record<string, string>) => new Request("http://dashboard.test/api/session", { method: "POST", headers });

  it("accepts a request started by the dashboard's own pages", () => {
    expect(isSameOrigin(request({ origin: "https://app.devytalk.test", host: "app.devytalk.test" }))).toBe(true);
    expect(isSameOrigin(request({ origin: "https://app.devytalk.test", host: "10.0.0.5:3000", "x-forwarded-host": "app.devytalk.test" }))).toBe(true);
  });

  it("refuses another site, a missing origin and a malformed one", () => {
    expect(isSameOrigin(request({ origin: "https://evil.test", host: "app.devytalk.test" }))).toBe(false);
    expect(isSameOrigin(request({ host: "app.devytalk.test" }))).toBe(false);
    expect(isSameOrigin(request({ origin: "null", host: "app.devytalk.test" }))).toBe(false);
  });
});

describe("session cookie", () => {
  it("cannot be read by page scripts and is not sent from other sites", () => {
    const options = sessionCookieOptions();
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("strict");
    expect(options.path).toBe("/");
  });
});
