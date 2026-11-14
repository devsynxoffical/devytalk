import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { THEME_BOOT, THEME_KEY, isThemeChoice, resolveTheme } from "./theme";

describe("resolveTheme", () => {
  it("is light unless dark was chosen, or the device is dark and the person follows it", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("accepts only the three choices from storage", () => {
    expect(["light", "dark", "system"].every(isThemeChoice)).toBe(true);
    expect([null, "", "DARK", "blue", 1].some(isThemeChoice)).toBe(false);
  });
});

describe("the script that runs before first paint", () => {
  /** Run the boot script against a made-up browser and report the theme it set. */
  function boot(stored: string | null | Error, deviceDark: boolean): string {
    const documentElement = { dataset: {} as Record<string, string> };
    const localStorage = {
      getItem(key: string) {
        if (stored instanceof Error) throw stored;
        return key === THEME_KEY ? stored : null;
      },
    };
    new Function("document", "localStorage", "matchMedia", THEME_BOOT)({ documentElement }, localStorage, () => ({ matches: deviceDark }));
    return documentElement.dataset.theme;
  }

  it("agrees with resolveTheme for every stored choice and device setting", () => {
    for (const choice of ["light", "dark", "system"] as const) {
      for (const deviceDark of [true, false]) expect(boot(choice, deviceDark)).toBe(resolveTheme(choice, deviceDark));
    }
  });

  it("falls back to light with nothing stored, a value it does not know, or storage that throws", () => {
    expect(boot(null, true)).toBe("light");
    expect(boot("purple", true)).toBe("light");
    expect(boot(new Error("storage is blocked"), true)).toBe("light");
  });
});

describe("text contrast in both themes", () => {
  const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");
  const tokens = (block: string) => Object.fromEntries([...block.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)].map((m) => [m[1], m[2].toLowerCase()]));
  const light = tokens(css.slice(css.indexOf("@theme"), css.indexOf("@layer base")));
  const dark = { ...light, ...tokens(css.slice(css.indexOf('[data-theme="dark"] .app {'), css.indexOf(".app :focus-visible"))) };

  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  // [text, background, least contrast]: 4.5 for text (WCAG AA), 3 for marks and control borders.
  const pairs: [string, string, number][] = [
    ["--color-fg", "--color-surface", 7],
    ["--color-fg", "--color-paper", 7],
    ["--color-fg-2", "--color-surface", 7],
    ["--color-fg-3", "--color-surface", 4.5],
    ["--color-fg-3", "--color-sunken", 4.5],
    ["--color-fg", "--color-sunken", 7],
    ["--color-accent", "--color-surface", 4.5],
    ["--color-crit", "--color-surface", 4.5],
    ["--color-crit", "--color-crit-bg", 4.5],
    ["--color-fg", "--color-pos-bg", 7],
    ["--color-fg", "--color-warn-bg", 7],
    ["--color-fg", "--color-info-bg", 7],
    ["--color-on-signal", "--color-signal", 4.5],
    ["--color-on-signal", "--color-accent-strong", 4.5],
    ["--color-pos-mark", "--color-surface", 3],
    ["--color-warn-mark", "--color-surface", 3],
    ["--color-crit-mark", "--color-surface", 3],
  ];

  it.each([
    ["light", light],
    ["dark", dark],
  ])("%s theme: text and marks can be read on their backgrounds", (_name, theme) => {
    const failures = pairs.filter(([text, background, least]) => contrast(theme[text], theme[background]) < least).map(([text, background, least]) => `${text} on ${background}: ${contrast(theme[text], theme[background]).toFixed(2)} < ${least}`);
    expect(failures).toEqual([]);
  });

  it("the dark theme really is a different set of surfaces", () => {
    expect(dark["--color-surface"]).not.toBe(light["--color-surface"]);
    expect(luminance(dark["--color-paper"])).toBeLessThan(0.05);
  });
});
