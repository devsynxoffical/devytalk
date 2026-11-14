import { describe, expect, it } from "vitest";
import { DASH, budgetUse, count, dateTime, duration, fileSize, label, languageName, money, percent } from "./format";

describe("number display", () => {
  it("shows a dash for a value that does not exist, never a zero", () => {
    expect(percent(null)).toBe(DASH);
    expect(money(undefined)).toBe(DASH);
    expect(count(null)).toBe(DASH);
    expect(duration(null)).toBe(DASH);
    expect(dateTime(null)).toBe(DASH);
    expect(dateTime("not a date")).toBe(DASH);
  });

  it("keeps a real zero as zero", () => {
    expect(percent(0)).toBe("0.0%");
    expect(money(0)).toBe("$0.00");
    expect(count(0)).toBe("0");
  });

  it("formats rates, money, counts and durations", () => {
    expect(percent(0.25)).toBe("25.0%");
    expect(percent(0.294, 0)).toBe("29%");
    expect(money(1234.5)).toBe("$1,234.50");
    expect(count(12345)).toBe("12,345");
    expect(duration(95)).toBe("1:35");
  });

  it("turns engine codes into words", () => {
    expect(label("not_interested")).toBe("Not interested");
    expect(label(null)).toBe(DASH);
    expect(languageName("ar")).toBe("Arabic");
    expect(languageName("sw")).toBe("sw");
  });
});

describe("budgetUse", () => {
  it("is null when no budget is set, so the page says so instead of drawing a bar", () => {
    expect(budgetUse(10, null)).toBeNull();
    expect(budgetUse(10, 0)).toBeNull();
  });

  it("reports what is left and the share used", () => {
    expect(budgetUse(25, 100)).toEqual({ remaining: 75, share: 0.25 });
  });

  it("never shows a negative remainder or more than 100% when spend passed the budget", () => {
    expect(budgetUse(32.05, 32)).toEqual({ remaining: 0, share: 1 });
  });
});

describe("fileSize", () => {
  it("uses the unit a person would", () => {
    expect(fileSize(840)).toBe("840 B");
    expect(fileSize(12 * 1024)).toBe("12 KB");
    expect(fileSize(3.4 * 1024 * 1024)).toBe("3.4 MB");
    expect(fileSize(null)).toBe(DASH);
  });
});
