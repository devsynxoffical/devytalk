import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";

/** Light page header for sub-pages: white with a soft mesh glow and dotted texture. */
export function PageHero({ eyebrow, title, description, children }: { eyebrow?: string; title: ReactNode; description?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden pb-16 pt-36 sm:pb-20 sm:pt-44">
      <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden="true" />
      <div className="absolute -top-32 left-1/2 h-96 w-[60rem] max-w-[200vw] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-200/70 via-sky-300/40 to-lime-300/60 blur-3xl" aria-hidden="true" />
      <div className="container-page relative text-center">
        {eyebrow && <Eyebrow className="mb-6">{eyebrow}</Eyebrow>}
        <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-balance text-ink-900 sm:text-6xl">{title}</h1>
        {description && <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-500 text-pretty">{description}</p>}
        {children && <div className="mt-9">{children}</div>}
      </div>
    </section>
  );
}
