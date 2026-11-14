/** The console's colour theme: the person's choice, kept in their browser. */
export type ThemeChoice = "light" | "dark" | "system";
export const THEME_KEY = "dt_theme";
export const THEME_CHOICES: [ThemeChoice, string][] = [
  ["light", "Light"],
  ["dark", "Dark"],
  ["system", "System"],
];

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "light" || value === "dark" || value === "system";
}

/** Light unless the person chose dark, or chose to follow a device that is set to dark. */
export function resolveTheme(choice: ThemeChoice, systemPrefersDark: boolean): "light" | "dark" {
  return choice === "dark" || (choice === "system" && systemPrefersDark) ? "dark" : "light";
}

/**
 * Runs before the first paint, so a page never flashes in the wrong theme. Kept in step
 * with `resolveTheme` by a test.
 */
export const THEME_BOOT = `(function(){var d=document.documentElement,t="light";try{var c=localStorage.getItem("${THEME_KEY}");if(c==="dark"||(c==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))t="dark"}catch(e){}d.dataset.theme=t})()`;
