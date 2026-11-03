"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { integrationCategories, integrations, type IntegrationCategory } from "@/content/integrations";
import { cn } from "@/lib/cn";

export function IntegrationsBrowser() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IntegrationCategory | "All">("All");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return integrations.filter(
      (i) => (category === "All" || i.category === category) && (!q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)),
    );
  }, [query, category]);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {(["All", ...integrationCategories] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                category === c ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 bg-white text-ink-600 hover:border-brand-400",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <label htmlFor="integration-search" className="sr-only">Search integrations</label>
          <input
            id="integration-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search integrations"
            className="w-full rounded-full border border-ink-200 bg-white py-2.5 pl-11 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        </div>
      </div>

      <p className="mt-6 text-sm text-ink-500" aria-live="polite">
        {results.length} {results.length === 1 ? "integration" : "integrations"}
      </p>

      {results.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink-300 bg-white p-12 text-center">
          <p className="font-semibold text-ink-900">No integrations match “{query}”.</p>
          <p className="mt-1 text-sm text-ink-500">Connect anything else through Zapier, Make, webhooks or the REST API.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((i) => (
            <li key={i.name} className="group rounded-2xl border border-ink-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl text-sm font-extrabold text-white" style={{ backgroundColor: i.color }} aria-hidden="true">
                  {i.name.slice(0, 2)}
                </span>
                <div>
                  <p className="font-bold text-ink-900">{i.name}</p>
                  <p className="text-xs text-ink-500">{i.category}</p>
                </div>
                {i.popular && <span className="ml-auto rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">Popular</span>}
              </div>
              <p className="mt-4 text-sm text-ink-500">{i.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
