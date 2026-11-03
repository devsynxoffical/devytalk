export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: { heading: string; text: string }[] }) {
  return (
    <div className="bg-white">
      <header className="bg-ink-900 pb-14 pt-32 text-white sm:pt-40">
        <div className="container-page max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-3 text-ink-300">Last updated {updated}</p>
        </div>
      </header>
      <div className="container-page max-w-3xl space-y-8 py-16">
        <p className="rounded-xl bg-accent-300/30 p-4 text-sm text-ink-700">
          Template text for the marketing site. Have it reviewed by legal counsel before launch.
        </p>
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-xl font-bold">{s.heading}</h2>
            <p className="mt-2 leading-relaxed text-ink-600">{s.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
