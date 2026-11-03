import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPost, posts } from "@/content/blog";
import { formatDate } from "@/lib/format";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { CtaBand } from "@/components/sections/CtaBand";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

export default async function PostPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const more = posts.filter((p) => p.slug !== post.slug).slice(0, 3);
  return (
    <>
      <article>
        <header className="relative overflow-hidden pb-12 pt-36 sm:pt-44">
          <div className="absolute -top-32 left-1/2 h-96 w-[60rem] max-w-[200vw] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand-200/60 via-sky-300/30 to-lime-300/50 blur-3xl" aria-hidden="true" />
          <div className="container-page relative max-w-3xl">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-ink-900">
              <ArrowLeft className="size-4" aria-hidden="true" /> All posts
            </Link>
            <div className="mt-8">
              <Eyebrow>{post.category}</Eyebrow>
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-5xl">{post.title}</h1>
            <p className="mt-5 text-ink-500">
              {formatDate(post.date)} · {post.readMinutes} min read
            </p>
          </div>
        </header>
        <div className="container-page max-w-3xl pb-16">
          <p className="border-l-4 border-brand-400 pl-5 text-xl leading-relaxed text-ink-700">{post.excerpt}</p>
          {post.body.map((block, i) => (
            <div key={i} className="mt-10">
              {block.heading && <h2 className="mb-3 text-2xl font-semibold tracking-tight">{block.heading}</h2>}
              <p className="text-lg leading-relaxed text-ink-600">{block.text}</p>
            </div>
          ))}
        </div>
      </article>
      <section className="container-page max-w-3xl border-t border-ink-100 py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-400">Keep reading</p>
        <ul className="mt-5 divide-y divide-ink-100">
          {more.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="flex items-center justify-between gap-4 py-4 font-medium text-ink-900 hover:text-brand-700">
                {p.title}
                <span className="shrink-0 text-sm text-ink-400">{p.readMinutes} min</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <CtaBand />
    </>
  );
}
