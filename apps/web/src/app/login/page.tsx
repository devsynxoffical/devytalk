import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/interactive/LoginForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const POINTS: [string, string][] = [
  ["Every call accounted for", "Outcome, transcript, summary and follow-up for each call your agent places or answers."],
  ["Leads ranked by evidence", "Scores come from what prospects said on the phone, with the quotes behind them."],
  ["Nothing goes live unapproved", "The coach drafts improvements. You approve, reject or roll back."],
];

export default function LoginPage() {
  return (
    <div className="app grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-rail p-10 text-rail-fg lg:flex">
        <Link href="/" className="flex items-center gap-2.5" aria-label="DevyTalk home">
          <span className="grid size-7 place-items-center rounded-[7px] bg-signal" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-4 text-rail" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M5 12h.5M8.5 8.5v7M12 5v14M15.5 8.5v7M19 12h.5" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">DevyTalk</span>
        </Link>
        <div>
          <p className="max-w-md text-[28px] font-medium leading-[1.2] tracking-[-0.02em] text-white">The console for AI sales calls.</p>
          <ul className="mt-8 max-w-md space-y-5">
            {POINTS.map(([title, text]) => (
              <li key={title} className="border-l-2 border-signal/70 pl-4">
                <p className="text-[14px] font-medium text-white">{title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[12px] text-rail-fg/60">Access is limited to operators of this calling engine.</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 pt-safe">
        <div className="w-full max-w-sm animate-rise">
          <span className="mb-8 grid size-9 place-items-center rounded-[9px] bg-rail lg:hidden" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-5 text-signal" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M5 12h.5M8.5 8.5v7M12 5v14M15.5 8.5v7M19 12h.5" />
            </svg>
          </span>
          <h1 className="t-title text-fg">Sign in</h1>
          <p className="mt-1 text-[13.5px] text-fg-2">Open the DevyTalk console with your engine&apos;s access token.</p>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
          <p className="mt-8 border-t border-line pt-4 text-[12.5px] text-fg-3">
            Not a customer yet?{" "}
            <Link href="/demo" className="font-medium text-accent hover:underline">
              Talk to us
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
