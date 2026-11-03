import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPost, posts } from "@/content/blog";
import { formatDate } from "@/lib/format";
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
  return (
    <>
      <article>
        <header className="bg-ink-900 pb-16 pt-32 text-white sm:pt-40">
          <div className="container-page max-w-3xl">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-ink-300 hover:text-white">
              <ArrowLeft className="size-4" aria-hidden="true" /> All posts
            </Link>
            <p className="mt-8 text-sm font-bold uppercase tracking-widest text-brand-300">{post.category}</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">{post.title}</h1>
            <p className="mt-5 text-ink-300">{formatDate(post.date)} · {post.readMinutes} min read</p>
          </div>
        </header>
        <div className="container-page max-w-3xl py-16">
          <p className="text-xl text-ink-600">{post.excerpt}</p>
          {post.body.map((block, i) => (
            <div key={i} className="mt-8">
              {block.heading && <h2 className="mb-3 text-2xl font-bold">{block.heading}</h2>}
              <p className="text-lg leading-relaxed text-ink-700">{block.text}</p>
            </div>
          ))}
        </div>
      </article>
      <CtaBand />
    </>
  );
}
