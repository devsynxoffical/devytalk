"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, ChevronDown, MessageCircleQuestion, Route, Search } from "lucide-react";
import { GLOSSARY, searchHelp, type Guide, type Term } from "@/content/console-help";
import { cn } from "@/lib/cn";
import { EmptyState, Input, PageHeader, Panel, buttonClass } from "@/components/dashboard/ui";

const GROUPS: Term["group"][] = ["Basics", "Results", "Leads", "Playbook", "Calling rules", "Account"];

function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Panel title={guide.title} description={guide.summary} id={guide.id} className="scroll-mt-20">
      <ol className="space-y-3.5">
        {guide.steps.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="t-figure mt-px grid size-6 shrink-0 place-items-center rounded-full bg-pos-bg text-[12px] font-medium text-fg" aria-hidden="true">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-medium text-fg">{step.title}</p>
              <p className="mt-0.5 text-[13px] text-fg-2">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      {guide.where && (
        <Link href={guide.where.href} className={buttonClass("secondary", "md", "mt-4")}>
          {guide.where.label} <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      )}
    </Panel>
  );
}

/** How the product works, what its words mean and the questions asked first: all searchable from one field. */
export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<string | null>(null);
  const found = useMemo(() => searchHelp(query), [query]);
  const searching = query.trim().length > 0;
  const nothing = found.terms.length + found.guides.length + found.questions.length === 0;

  // A hint elsewhere in the console links to one word here: bring it into view and mark it.
  useEffect(() => {
    const read = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      setTarget(id || null);
      if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "center" }));
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  return (
    <div className="max-w-5xl">
      <PageHeader title="Help" description="How DevyTalk works, what each word on these screens means, and the questions people ask first." />

      <div className="relative mt-5 max-w-xl">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-3" aria-hidden="true" />
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help: budget, hot lead, pause…" aria-label="Search help" className="pl-8" />
      </div>
      {!searching && (
        <nav aria-label="On this page" className="mt-3 flex flex-wrap gap-2">
          {[
            ["#guides", "Step-by-step guides", Route],
            ["#questions", "Common questions", MessageCircleQuestion],
            ["#words", "What the words mean", BookOpen],
          ].map(([href, text, Icon]) => (
            <a key={href as string} href={href as string} className="inline-flex h-8 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-2.5 text-[12.5px] font-medium text-fg-2 hover:border-fg-3 hover:text-fg">
              <Icon className="size-3.5" aria-hidden="true" />
              {text as string}
            </a>
          ))}
        </nav>
      )}

      {nothing ? (
        <div className="mt-6">
          <EmptyState title={`Nothing in Help matches “${query.trim()}”`} icon={Search}>
            Try one word, such as “budget” or “lead”.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 space-y-9">
          {found.guides.length > 0 && (
            <section id="guides" aria-labelledby="guides-title" className="scroll-mt-20">
              <h2 id="guides-title" className="t-section text-fg">
                Step-by-step guides
              </h2>
              <div className="mt-3 grid grid-cols-1 items-start gap-4 lg:grid-cols-2 [&>*]:min-w-0">
                {found.guides.map((guide) => (
                  <GuideCard key={guide.id} guide={guide} />
                ))}
              </div>
            </section>
          )}

          {found.questions.length > 0 && (
            <section id="questions" aria-labelledby="questions-title" className="scroll-mt-20">
              <h2 id="questions-title" className="t-section text-fg">
                Common questions
              </h2>
              <div className="mt-3 divide-y divide-line rounded-panel border border-line bg-surface">
                {found.questions.map((item) => (
                  <details key={item.id} id={item.id} open={searching || target === item.id} className="group scroll-mt-20">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-[13.5px] font-medium text-fg hover:bg-sunken [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <ChevronDown className="size-4 shrink-0 text-fg-3 transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <p className="max-w-3xl px-4 pb-4 text-[13.5px] leading-[21px] text-fg-2">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {found.terms.length > 0 && (
            <section id="words" aria-labelledby="words-title" className="scroll-mt-20">
              <h2 id="words-title" className="t-section text-fg">
                What the words mean
              </h2>
              <p className="t-meta mt-1">
                {searching ? `${found.terms.length} of ${GLOSSARY.length} words` : "The same explanations open from the small question marks beside figures and column headings."}
              </p>
              <div className="mt-3 space-y-6">
                {GROUPS.filter((group) => found.terms.some((t) => t.group === group)).map((group) => (
                  <div key={group}>
                    <h3 className="t-eyebrow mb-2">{group}</h3>
                    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-panel border border-line bg-line md:grid-cols-2" data-testid={`words-${group}`}>
                      {found.terms
                        .filter((t) => t.group === group)
                        .map((term) => (
                          <div key={term.id} id={term.id} className={cn("scroll-mt-20 px-4 py-3 transition-colors md:last:odd:col-span-2", target === term.id ? "bg-pos-bg" : "bg-surface")}>
                            <dt className="text-[13.5px] font-semibold text-fg">{term.term}</dt>
                            <dd className="mt-1 text-[13px] leading-[19px] text-fg-2">
                              {term.short}
                              {term.more && <span className="mt-1.5 block text-fg-3">{term.more}</span>}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
