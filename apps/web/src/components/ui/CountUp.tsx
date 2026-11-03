"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates the leading number in a value like "140+", "99.99%" or "$1,200" from 0 when it
 * scrolls into view. Values without a leading number are rendered as-is.
 */
export function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const match = value.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!match || !ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [, prefix, num, suffix] = match;
    const target = parseFloat(num.replace(/,/g, ""));
    const decimals = num.includes(".") ? num.split(".")[1].length : 0;
    const format = (n: number) => prefix + n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    setDisplay(format(0));
    let frame = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(format(target * eased));
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(ref.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}
