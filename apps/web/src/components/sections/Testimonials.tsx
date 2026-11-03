import { Quote } from "lucide-react";
import { testimonials } from "@/content/social";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Testimonials() {
  return (
    <section className="container-page py-24">
      <SectionHeading eyebrow="Customers" title="Teams that switched never looked back" />
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {testimonials.map((t) => (
          <figure key={t.name} className="flex flex-col rounded-3xl border border-ink-200 bg-white p-8">
            <Quote className="size-8 text-brand-400" aria-hidden="true" />
            <blockquote className="mt-4 flex-1 text-lg text-ink-700">“{t.quote}”</blockquote>
            <figcaption className="mt-8 flex items-center justify-between gap-4 border-t border-ink-100 pt-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 font-bold text-white" aria-hidden="true">
                  {t.name[0]}
                </span>
                <div>
                  <p className="font-bold text-ink-900">{t.name}</p>
                  <p className="text-sm text-ink-500">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-accent-300/40 px-3 py-1 text-xs font-bold text-ink-900">{t.metric}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
