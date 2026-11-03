export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: { heading: string; text: string }[] }) {
  return (
    <div>
      <header className="relative overflow-hidden pb-12 pt-36 sm:pt-44">
        <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden="true" />
        <div className="container-page relative max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 text-ink-500">Last updated {updated}</p>
        </div>
      </header>
      <div className="container-page max-w-3xl space-y-8 pb-24">
        <p className="rounded-xl border border-lime-400 bg-lime-300/20 p-4 text-sm text-ink-700">
          Template text for the marketing site. Have it reviewed by legal counsel before launch.
        </p>
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-xl font-semibold">{s.heading}</h2>
            <p className="mt-2 leading-relaxed text-ink-600">{s.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
