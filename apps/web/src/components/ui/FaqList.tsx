import { Plus } from "lucide-react";

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-ink-100 border-y border-ink-100">
      {items.map((item) => (
        <details key={item.q} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] font-medium text-ink-900 transition-colors hover:text-brand-700">
            {item.q}
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-ink-200 transition-all group-open:rotate-45 group-open:border-brand-500 group-open:bg-brand-500 group-open:text-white">
              <Plus className="size-4" aria-hidden="true" />
            </span>
          </summary>
          <p className="mt-3 max-w-2xl pr-12 leading-relaxed text-ink-500">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
