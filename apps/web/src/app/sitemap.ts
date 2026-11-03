import type { MetadataRoute } from "next";
import { features } from "@/content/features";
import { solutions } from "@/content/solutions";
import { posts } from "@/content/blog";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/features",
    "/pricing",
    "/integrations",
    "/numbers",
    "/customers",
    "/about",
    "/blog",
    "/demo",
    "/signup",
    "/legal/privacy",
    "/legal/terms",
    ...features.map((f) => `/features/${f.slug}`),
    ...solutions.map((s) => `/solutions/${s.slug}`),
    ...posts.map((p) => `/blog/${p.slug}`),
  ];
  return paths.map((p) => ({ url: `${base}${p}` }));
}
