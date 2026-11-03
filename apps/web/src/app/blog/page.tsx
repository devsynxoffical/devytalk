import type { Metadata } from "next";
import Link from "next/link";
import { posts } from "@/content/blog";
import { formatDate } from "@/lib/format";
import { PageHero } from "@/components/ui/PageHero";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata: Metadata = { title: "Blog", description: "Guides, research and product news for sales and support teams." };

export default function BlogPage() {
  const [lead, ...rest] = posts;
  return (
    <>
      <PageHero eyebrow="Blog" title="Ideas for teams that talk to customers" description="Practical guides, research and product news from the DevyTalk team." />
      <section className="container-page py-16">
        <Link href={`/blog/${lead.slug}`} className="group grid overflow-hidden rounded-3xl border border-ink-200 bg-white md:grid-cols-2">
          <div className="min-h-56 bg-gradient-to-br from-brand-500 via-brand-700 to-ink-900 p-10">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">{lead.category}</span>
          </div>
          <div className="p-8 sm:p-10">
            <p className="text-sm text-ink-500">{formatDate(lead.date)} · {lead.readMinutes} min read</p>
            <h2 className="mt-3 text-2xl font-extrabold group-hover:text-brand-700 sm:text-3xl">{lead.title}</h2>
            <p className="mt-3 text-ink-500">{lead.excerpt}</p>
          </div>
        </Link>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="group flex flex-col rounded-3xl border border-ink-200 bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-lg">
              <span className="self-start rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{p.category}</span>
              <h2 className="mt-4 flex-1 text-lg font-bold group-hover:text-brand-700">{p.title}</h2>
              <p className="mt-4 text-sm text-ink-500">{formatDate(p.date)} · {p.readMinutes} min read</p>
            </Link>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
