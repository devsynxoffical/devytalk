import { ChevronDown } from "lucide-react";

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-ink-200 rounded-2xl border border-ink-200 bg-white">
      {items.map((item) => (
        <details key={item.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink-900">
            {item.q}
            <ChevronDown className="size-5 shrink-0 text-ink-400 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="mt-3 text-ink-500">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
