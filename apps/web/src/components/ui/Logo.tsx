import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative grid size-8 place-items-center rounded-[10px] bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800", className)}>
      <svg viewBox="0 0 24 24" className="size-[18px] text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M4 12h1.5M8 8.5v7M12 5v14M16 8.5v7M19.5 12H20" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-white bg-lime-400" />
    </span>
  );
}

export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="DevyTalk home" className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className={cn("text-[1.3rem] font-bold tracking-tight", inverted ? "text-white" : "text-ink-900")}>
        devy<span className={inverted ? "text-lime-400" : "text-brand-600"}>talk</span>
      </span>
    </Link>
  );
}
