"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { countryNumbers, type NumberType } from "@/content/numbers";
import { cn } from "@/lib/cn";

const TYPES: NumberType[] = ["Local", "Mobile", "Toll-free"];

export function NumbersBrowser() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<NumberType | "Any">("Any");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return countryNumbers.filter(
      (c) => (type === "Any" || c.types[type] !== undefined) && (!q || c.country.toLowerCase().includes(q) || c.code.toLowerCase() === q),
    );
  }, [query, type]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <label htmlFor="country-search" className="sr-only">Search countries</label>
          <input
            id="country-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a country"
            className="w-full rounded-full border border-ink-200 bg-white py-2.5 pl-11 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Number type">
          {(["Any", ...TYPES] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                type === t ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 bg-white text-ink-600 hover:border-brand-400",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink-200 bg-white">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase tracking-widest text-ink-500">
            <tr>
              <th scope="col" className="p-4">Country</th>
              <th scope="col" className="p-4">Region</th>
              {TYPES.map((t) => (
                <th key={t} scope="col" className="p-4 text-right">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.code} className="border-t border-ink-100 hover:bg-brand-50/40">
                <th scope="row" className="p-4 font-semibold text-ink-900">
                  <span className="mr-2" aria-hidden="true">{c.flag}</span>
                  {c.country}
                </th>
                <td className="p-4 text-ink-500">{c.region}</td>
                {TYPES.map((t) => (
                  <td key={t} className="p-4 text-right font-mono">
                    {c.types[t] !== undefined ? `$${c.types[t]}/mo` : <span className="text-ink-300">—</span>}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-ink-500">
                  No coverage found for that search yet. <a href="/demo" className="font-semibold text-brand-700 underline">Ask our team</a> about it.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
