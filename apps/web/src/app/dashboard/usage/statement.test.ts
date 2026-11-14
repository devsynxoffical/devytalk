import { describe, expect, it } from "vitest";
import { basisName, monthName, usd } from "./statement";

describe("usage statement", () => {
  it("shows amounts as money, keeping fractions of a cent on small ones", () => {
    expect(usd("12.3400")).toBe("$12.34");
    expect(usd("0.0150")).toBe("$0.015");
    expect(usd("0.3200")).toBe("$0.32");
    expect(usd("0.4846")).toBe("$0.48"); // from ten cents up, cents are enough
    expect(usd("0.0999")).toBe("$0.0999");
    expect(usd("-0.1000")).toBe("-$0.10");
    expect(usd("0.0000")).toBe("$0.00");
  });

  it("shows a dash, not zero, for an amount that is missing", () => {
    expect(usd(null)).toBe("–");
    expect(usd("")).toBe("–");
    expect(usd("n/a")).toBe("–");
  });

  it("names a month, and leaves alone what is not one", () => {
    expect(monthName("2026-11")).toBe("November 2026");
    expect(monthName("2027-01")).toBe("January 2027");
    expect(monthName("soon")).toBe("soon");
  });

  it("says in words how far an amount can be trusted", () => {
    expect(basisName("provider")).toMatch(/provider/);
    expect(basisName("something new")).toBe("something new");
  });
});
