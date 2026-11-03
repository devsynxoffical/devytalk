import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { posts } from "@/content/blog";
import { formatDate } from "@/lib/format";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata: Metadata = { title: "Blog", description: "Guides, research and product news for sales and support teams." };

const covers = [
  "from-brand-300 via-brand-500 to-sky-400",
  "from-lime-300 via-brand-300 to-brand-600",
  "from-sky-300 via-brand-300 to-lime-300",
  "from-brand-500 via-brand-700 to-ink-900",
  "from-lime-200 via-sky-300 to-brand-500",
  "from-sky-400 via-brand-500 to-brand-800",
];

export default function BlogPage() {
  const [lead, ...rest] = posts;
  return (
    <>
      <PageHero eyebrow="Blog" title="Ideas for teams that talk to customers" description="Practical guides, research and product news from the DevyTalk team." />
      <section className="container-page pb-16 sm:pb-24">
        <Link href={`/blog/${lead.slug}`} className="group shadow-card grid grid-cols-1 [&>*]:min-w-0 overflow-hidden rounded-[1.75rem] border border-ink-100 bg-white md:grid-cols-2">
          <div className={`relative min-h-60 bg-gradient-to-br ${covers[0]} p-8`}>
            <div className="bg-dots absolute inset-0 opacity-40 invert" aria-hidden="true" />
            <span className="relative rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-900">{lead.category}</span>
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <p className="text-sm text-ink-500">
              {formatDate(lead.date)} · {lead.readMinutes} min read
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight transition-colors group-hover:text-brand-700 sm:text-3xl">{lead.title}</h2>
            <p className="mt-3 leading-relaxed text-ink-500">{lead.excerpt}</p>
          </div>
        </Link>
        <div className="mt-8 grid grid-cols-1 [&>*]:min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 80}>
              <Link href={`/blog/${p.slug}`} className="group shadow-card flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-ink-100 bg-white transition-all duration-300 hover:-translate-y-1">
                <div className={`relative h-40 bg-gradient-to-br ${covers[(i + 1) % covers.length]} p-5`}>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-900">{p.category}</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="flex-1 text-lg font-semibold leading-snug transition-colors group-hover:text-brand-700">{p.title}</h2>
                  <p className="mt-4 flex items-center justify-between text-sm text-ink-500">
                    {formatDate(p.date)} · {p.readMinutes} min
                    <ArrowUpRight className="size-4 text-ink-300 group-hover:text-brand-600" aria-hidden="true" />
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
