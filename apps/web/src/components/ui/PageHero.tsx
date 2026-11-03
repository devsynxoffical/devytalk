import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, description, children }: { eyebrow?: string; title: ReactNode; description?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-ink-900 pb-20 pt-32 text-white sm:pt-40">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden="true" />
      <div className="absolute -top-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-brand-500/25 blur-3xl" aria-hidden="true" />
      <div className="container-page relative text-center">
        {eyebrow && <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-brand-300">{eyebrow}</p>}
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-300 text-pretty">{description}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
