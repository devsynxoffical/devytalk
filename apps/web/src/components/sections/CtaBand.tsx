import { ButtonLink } from "@/components/ui/Button";

export function CtaBand({
  title = "Start making better calls today",
  description = "Free for 14 days. No credit card. Set up in five minutes.",
}: { title?: string; description?: string }) {
  return (
    <section className="container-page py-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-700 to-ink-900 px-6 py-16 text-center text-white sm:px-16">
        <div className="bg-grid absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-accent-400/30 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">{description}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup" variant="accent" size="lg">
              Start free trial
            </ButtonLink>
            <ButtonLink href="/demo" variant="light" size="lg">
              Book a demo
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
