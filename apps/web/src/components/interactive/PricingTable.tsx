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

  return (
    <div>
      <div className="flex flex-col items-center gap-6">
        <div className="inline-flex rounded-full border border-ink-200 bg-white p-1 shadow-sm" role="group" aria-label="Billing period">
          {[false, true].map((isAnnual) => (
            <button
              key={String(isAnnual)}
              type="button"
              aria-pressed={annual === isAnnual}
              onClick={() => setAnnual(isAnnual)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                annual === isAnnual ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900",
              )}
            >
              {isAnnual ? (
                <>
                  Annual <span className="ml-1 rounded-full bg-accent-400 px-2 py-0.5 text-xs text-ink-900">-{ANNUAL_DISCOUNT * 100}%</span>
                </>
              ) : (
                "Monthly"
              )}
            </button>
          ))}
        </div>
        <div className="flex w-full max-w-md items-center gap-4">
          <label htmlFor="seats" className="shrink-0 text-sm font-semibold text-ink-700">
            Team size
          </label>
          <input id="seats" type="range" min={1} max={100} value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="w-full accent-brand-600" />
          <span className="w-20 shrink-0 text-right font-mono text-sm font-bold">{seats} {seats === 1 ? "user" : "users"}</span>
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const price = plan.monthly === null ? null : planPrice(plan.monthly, annual);
          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-3xl border p-7",
                plan.highlighted ? "border-brand-500 bg-ink-900 text-white shadow-2xl shadow-brand-700/20" : "border-ink-200 bg-white",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-7 rounded-full bg-accent-400 px-3 py-1 text-xs font-bold text-ink-900">Most popular</span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className={cn("mt-1 min-h-10 text-sm", plan.highlighted ? "text-ink-300" : "text-ink-500")}>{plan.description}</p>
              <div className="mt-6">
                {price === null ? (
                  <p className="text-4xl font-extrabold">Custom</p>
                ) : (
                  <p className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">${price}</span>
                    <span className={cn("text-sm", plan.highlighted ? "text-ink-300" : "text-ink-500")}>/ user / mo</span>
                  </p>
                )}
                <p className={cn("mt-1 h-5 text-xs", plan.highlighted ? "text-brand-300" : "text-brand-700")}>
                  {price !== null && `$${(price * seats).toLocaleString("en-US")} / mo for ${seats} ${seats === 1 ? "user" : "users"}${annual ? ", billed yearly" : ""}`}
                </p>
              </div>
              <Link
                href={plan.id === "enterprise" ? "/demo" : `/signup?plan=${plan.id}`}
                className={buttonClass(plan.highlighted ? "accent" : "outline", "md", "mt-6 w-full")}
              >
                {plan.cta}
              </Link>
              <ul className="mt-7 space-y-3 text-sm">
                {plan.includes.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Check className={cn("mt-0.5 size-4 shrink-0", plan.highlighted ? "text-brand-300" : "text-brand-600")} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-24">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">Compare every plan</h2>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-ink-200 bg-white">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200">
                <th className="p-4 font-semibold text-ink-500" scope="col">Feature</th>
                {plans.map((p) => (
                  <th key={p.id} scope="col" className={cn("p-4 text-center font-bold", p.highlighted && "text-brand-700")}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            {comparison.map((group) => (
              <tbody key={group.group}>
                <tr className="bg-ink-50">
                  <th colSpan={5} scope="colgroup" className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-ink-500">
                    {group.group}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label} className="border-t border-ink-100">
                    <th scope="row" className="p-4 font-medium text-ink-700">{row.label}</th>
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
