"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { Campaign, EngineStatus } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";
import { useAccess } from "./access";
import { launchSteps, nextStep } from "./launch";
import { buttonClass } from "./ui";

/**
 * The way to the first call, shown on the overview until every step is done. Each step
 * says where things stand and leads to the page where it is done; the next one to do
 * carries the button.
 */
export function LaunchGuide({ status, campaigns, calls }: { status: EngineStatus; campaigns: Campaign[]; calls: number | null }) {
  const { isAdmin } = useAccess();
  const steps = launchSteps(status, campaigns, calls);
  const next = nextStep(steps);
  if (!next) return null;
  const done = steps.filter((step) => step.done).length;

  return (
    <section aria-labelledby="launch-title" data-testid="launch-guide" className="overflow-hidden rounded-panel border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <div className="min-w-0">
          <h2 id="launch-title" className="t-section text-fg">
            {done === 0 ? "Four steps to your first call" : "Almost ready to call"}
          </h2>
          <p className="t-meta mt-0.5">
            {done} of {steps.length} done. Next: {next.title.toLowerCase()}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-label="Steps done" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done}>
            <div className="h-full rounded-full bg-signal transition-[width] duration-500" style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>
          <Link href="/dashboard/help#first-call" className="text-[12.5px] font-medium text-accent hover:underline">
            How it works
          </Link>
        </div>
      </header>
      <ol className="grid grid-cols-1 gap-px border-t border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, i) => {
          const current = step.id === next.id;
          const allowed = !step.admin || isAdmin;
          return (
            // On a phone a finished step is one line: its name and the way back to it.
            <li key={step.id} className={cn("flex flex-col gap-2 px-4 py-3.5", current ? "bg-pos-bg" : "bg-surface", step.done && "max-sm:flex-row max-sm:items-center max-sm:justify-between max-sm:py-2.5")} aria-current={current ? "step" : undefined}>
              <div className="flex items-center gap-2.5">
                <span
                  className={cn("t-figure grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-medium", step.done ? "bg-signal text-on-signal" : current ? "bg-surface text-fg ring-2 ring-signal" : "bg-sunken text-fg-3")}
                  role="img"
                  aria-label={step.done ? "Done" : current ? "Next" : "Later"}
                >
                  {step.done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                </span>
                <p className={cn("text-[13.5px] font-medium", step.done ? "text-fg-2" : "text-fg")}>{step.title}</p>
              </div>
              <p className={cn("t-meta flex-1 pl-[34px]", step.done && "max-sm:hidden")}>{step.text}</p>
              <div className={cn("pl-[34px]", step.done && "max-sm:shrink-0 max-sm:pl-0")}>
                {!allowed ? (
                  <p className="t-meta">An admin does this.</p>
                ) : current ? (
                  <Link href={step.href} className={buttonClass("primary", "sm")}>
                    {step.action} <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link href={step.href} className="text-[12.5px] font-medium text-accent hover:underline">
                    {step.action}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
