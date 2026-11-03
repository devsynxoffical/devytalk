import { FaqList } from "@/components/ui/FaqList";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";

export function FaqWithContact({ items, title = "Frequently asked questions" }: { items: { q: string; a: string }[]; title?: string }) {
  return (
    <section className="container-page py-16 sm:py-24">
      <SectionHeading title={title} description="Everything you need to know about the product and billing." />
      <div className="mt-12">
        <FaqList items={items} />
      </div>
      <div className="shadow-card mx-auto mt-12 flex max-w-3xl flex-col items-start gap-5 rounded-2xl border border-ink-100 bg-white p-5 sm:flex-row sm:items-center">
        <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-lime-300 to-brand-500 text-lg font-semibold text-white" aria-hidden="true">
          M
          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-brand-500" />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-ink-900">Hi, I&apos;m Maya 👋 Still have questions?</p>
          <p className="text-sm text-ink-500">Can&apos;t find the answer you&apos;re looking for? Our team replies within a few hours.</p>
        </div>
        <ButtonLink href="/demo">Get in touch</ButtonLink>
      </div>
    </section>
  );
}
