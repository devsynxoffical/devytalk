import { describe, expect, it } from "vitest";
import { niceMax, smoothPath } from "./AreaChart";

describe("chart axis", () => {
  it("ends on a round number at or above the data, so the top gridline is a readable value", () => {
    expect(niceMax(0)).toBe(4);
    expect(niceMax(3)).toBe(4);
    expect(niceMax(17)).toBe(20);
    expect(niceMax(36)).toBe(40);
    expect(niceMax(45)).toBe(50);
    expect(niceMax(100)).toBe(100);
    expect(niceMax(730)).toBe(800);
  });
});

describe("chart line", () => {
  it("passes through every data point", () => {
    const path = smoothPath([[0, 10], [50, 40], [100, 20]]);
    expect(path.startsWith("M0,10")).toBe(true);
    expect(path).toContain(" 50,40");
    expect(path.endsWith(" 100,20")).toBe(true);
  });

  it("stays flat between equal values instead of dipping below zero around a spike", () => {
    // Values 0, 0, 9, 0, 0 drawn top-down (y = 100 is zero). No control point may go below the baseline.
    const path = smoothPath([[0, 100], [10, 100], [20, 10], [30, 100], [40, 100]]);
    const ys = [...path.matchAll(/,(-?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
    expect(Math.max(...ys)).toBeLessThanOrEqual(100);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(10);
  });

  it("handles one point and none", () => {
    expect(smoothPath([])).toBe("");
    expect(smoothPath([[5, 5]])).toBe("M5,5");
  });
});
