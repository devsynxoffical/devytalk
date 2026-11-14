"use client";

import { useCallback, useEffect, useState } from "react";
import { THEME_KEY, isThemeChoice, resolveTheme, type ThemeChoice } from "@/lib/theme";

const DARK = "(prefers-color-scheme: dark)";

/** The person's theme choice. Stored in their browser; the console works the same if storage is unavailable. */
export function useTheme(): { choice: ThemeChoice; setChoice: (choice: ThemeChoice) => void } {
  const [choice, setState] = useState<ThemeChoice>("light");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_KEY);
      if (isThemeChoice(stored)) setState(stored);
    } catch {
      /* private window or blocked storage: stay on light */
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia(DARK);
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(choice, media.matches);
    };
    apply();
    if (choice !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [choice]);

  const setChoice = useCallback((next: ThemeChoice) => {
    setState(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* the choice then lasts until the page is closed */
    }
  }, []);

  return { choice, setChoice };
}
