"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { ANNUAL_DISCOUNT, comparison, planPrice, plans } from "@/content/pricing";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function PricingTable() {
  const [annual, setAnnual] = useState(true);
  const [seats, setSeats] = useState(5);
  const pct = ((seats - 1) / 99) * 100;

  return (
    <div>
      <div className="shadow-card mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-2xl border border-ink-100 bg-white p-4 sm:flex-row sm:justify-between sm:p-3">
        <div className="inline-flex rounded-xl bg-ink-50 p-1" role="group" aria-label="Billing period">
          {[false, true].map((isAnnual) => (
            <button
              key={String(isAnnual)}
              type="button"
              aria-pressed={annual === isAnnual}
              onClick={() => setAnnual(isAnnual)}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-semibold transition-all",
                annual === isAnnual ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900",
              )}
            >
              {isAnnual ? (
                <>
                  Annual <span className="ml-1 rounded-md bg-lime-400 px-1.5 py-0.5 text-xs text-ink-900">-{ANNUAL_DISCOUNT * 100}%</span>
                </>
              ) : (
                "Monthly"
              )}
            </button>
          ))}
        </div>
        <div className="flex w-full items-center gap-4 px-1 sm:max-w-sm sm:pr-3">
          <label htmlFor="seats" className="shrink-0 text-sm font-medium text-ink-700">
            Team size
          </label>
          <input
            id="seats"
            type="range"
            min={1}
            max={100}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full accent-brand-600"
            style={{ background: `linear-gradient(to right, var(--color-brand-500) ${pct}%, var(--color-ink-100) ${pct}%)` }}
          />
          <span className="w-20 shrink-0 text-right font-mono text-sm font-semibold">
            {seats} {seats === 1 ? "user" : "users"}
          </span>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 [&>*]:min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const price = plan.monthly === null ? null : planPrice(plan.monthly, annual);
          const hi = plan.highlighted;
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-[1.5rem] border p-7",
                hi ? "bg-mesh-dark shadow-float border-transparent text-white" : "shadow-card border-ink-100 bg-white",
              )}
            >
              {hi && <span className="absolute right-6 top-6 rounded-full bg-lime-400 px-3 py-1 text-xs font-bold text-ink-900">Most popular</span>}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className={cn("mt-1 min-h-10 text-sm", hi ? "text-white/70" : "text-ink-500")}>{plan.description}</p>
              <div className="mt-6">
                {price === null ? (
                  <p className="text-[2.6rem] font-semibold leading-none tracking-tight">Custom</p>
                ) : (
                  <p className="flex items-baseline gap-1">
                    <span className="text-[2.6rem] font-semibold leading-none tracking-tight">${price}</span>
                    <span className={cn("text-sm", hi ? "text-white/70" : "text-ink-500")}>/ user / mo</span>
                  </p>
                )}
                <p className={cn("mt-2 h-5 text-xs font-medium", hi ? "text-lime-300" : "text-brand-700")}>
                  {price !== null && `$${(price * seats).toLocaleString("en-US")} / mo for ${seats} ${seats === 1 ? "user" : "users"}${annual ? ", billed yearly" : ""}`}
                </p>
              </div>
              <Link href={plan.id === "enterprise" ? "/demo" : `/signup?plan=${plan.id}`} className={buttonClass(hi ? "white" : "outline", "md", "mt-6 w-full")}>
                {plan.cta}
              </Link>
              <ul className={cn("mt-7 space-y-3 border-t pt-6 text-sm", hi ? "border-white/15" : "border-ink-100")}>
                {plan.includes.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check className={cn("mt-0.5 size-4 shrink-0", hi ? "text-lime-300" : "text-brand-600")} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-24">
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-[2.6rem]">Compare every plan</h2>
        <div className="shadow-card mt-10 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100">
                <th className="p-4 font-medium text-ink-500" scope="col">
                  Feature
                </th>
                {plans.map((p) => (
                  <th key={p.id} scope="col" className={cn("p-4 text-center font-semibold", p.highlighted && "text-brand-700")}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            {comparison.map((group) => (
              <tbody key={group.group}>
                <tr className="bg-brand-50/50">
                  <th colSpan={5} scope="colgroup" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800">
                    {group.group}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label} className="border-t border-ink-100">
                    <th scope="row" className="p-4 font-medium text-ink-700">
                      {row.label}
                    </th>
                    {row.values.map((v, i) => (
                      <td key={i} className="p-4 text-center">
                        {v === true ? (
                          <Check className="mx-auto size-5 text-brand-600" aria-label="Included" />
                        ) : v === false ? (
                          <Minus className="mx-auto size-5 text-ink-300" aria-label="Not included" />
                        ) : (
                          <span className="text-ink-700">{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </div>
    </div>
  );
}
