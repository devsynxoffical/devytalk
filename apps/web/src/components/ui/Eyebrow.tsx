import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Eyebrow({ children, className, tone = "light" }: { children: ReactNode; className?: string; tone?: "light" | "dark" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        tone === "light" ? "border-brand-200 bg-brand-50 text-brand-700" : "border-white/25 bg-white/10 text-white",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", tone === "light" ? "bg-brand-500" : "bg-lime-400")} aria-hidden="true" />
      {children}
    </span>
  );
}
