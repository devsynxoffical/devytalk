import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { clientAddress, isRateLimited } from "./rate-limit";
import { securityHeaders } from "../../next.config";

const from = (forwarded?: string) => new Headers(forwarded === undefined ? {} : { "x-forwarded-for": forwarded });

describe("the address a request is limited by", () => {
  it("is the one our own proxy added, not one the client wrote", () => {
    // The client claimed to be 1.1.1.1; our proxy appended where the request really came from.
    expect(clientAddress(from("1.1.1.1, 203.0.113.9"), 1)).toBe("203.0.113.9");
    expect(clientAddress(from("203.0.113.9"), 1)).toBe("203.0.113.9");
    // Two proxies of ours in front: the second from the right.
    expect(clientAddress(from("9.9.9.9, 203.0.113.9, 10.0.0.2"), 2)).toBe("203.0.113.9");
  });

  it("cannot be varied by inventing addresses", () => {
    const attempts = ["1.1.1.1", "2.2.2.2", "3.3.3.3"].map((invented) => clientAddress(from(`${invented}, 203.0.113.9`), 1));
    expect(new Set(attempts).size).toBe(1);
  });

  it("ignores the header altogether when no proxy of ours is in front", () => {
    expect(clientAddress(from("1.1.1.1"), 0)).toBe("direct");
    expect(clientAddress(from(undefined), 1)).toBe("direct");
    expect(clientAddress(from(" , "), 1)).toBe("direct");
  });

  it("allows five attempts a minute from one address and then refuses", () => {
    const key = `test:${Math.random()}`;
    const results = Array.from({ length: 7 }, () => isRateLimited(key, 1_000));
    expect(results).toEqual([false, false, false, false, false, true, true]);
    expect(isRateLimited(key, 1_000 + 61_000)).toBe(false); // a minute later
  });
});

describe("what every response tells the browser", () => {
  const header = (name: string) => securityHeaders.find((h) => h.key === name)?.value ?? "";

  it("refuses framing, plugins and resources from other origins", () => {
    const policy = header("Content-Security-Policy");
    for (const rule of ["default-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'"]) {
      expect(policy).toContain(rule);
    }
    expect(policy).not.toMatch(/script-src[^;]*https?:/); // no script from elsewhere
    expect(header("X-Frame-Options")).toBe("DENY");
    expect(header("X-Content-Type-Options")).toBe("nosniff");
    expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header("Strict-Transport-Security")).toContain("max-age=31536000");
  });
});
