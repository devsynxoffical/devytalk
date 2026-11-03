"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** Cycles through words with a blur-and-slide transition. */
export function WordRotator({ words, interval = 2600, className, wordClassName }: { words: string[]; interval?: number; className?: string; wordClassName?: string }) {
  const [i, setI] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), interval - 350);
    const u = setTimeout(() => {
      setLeaving(false);
      setI((n) => (n + 1) % words.length);
    }, interval);
    return () => {
      clearTimeout(t);
      clearTimeout(u);
    };
  }, [i, interval, words.length]);

  return (
    <span className={className}>
      <span className="sr-only">{words.join(", ")}</span>
      <span
        key={i}
        aria-hidden="true"
        className={cn("inline-block", wordClassName)}
        style={{ animation: leaving ? "wordOut .35s ease-in forwards" : "wordIn .5s cubic-bezier(.2,.8,.2,1) both" }}
      >
        {words[i]}
      </span>
    </span>
  );
}
