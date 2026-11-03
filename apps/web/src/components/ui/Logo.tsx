import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="DevyTalk home" className={cn("inline-flex items-center gap-2 font-extrabold tracking-tight", className)}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg shadow-brand-700/30">
        <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 12h2M8 8v8M12 5v14M16 8v8M20 12h0" />
        </svg>
        <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-white bg-accent-400" />
      </span>
      <span className={cn("text-xl", inverted ? "text-white" : "text-ink-900")}>
        Devy<span className={inverted ? "text-brand-300" : "text-brand-600"}>Talk</span>
      </span>
    </Link>
  );
}
