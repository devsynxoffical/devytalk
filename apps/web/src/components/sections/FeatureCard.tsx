import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Feature } from "@/content/features";

export function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <Link
      href={`/features/${feature.slug}`}
      className="group flex flex-col rounded-3xl border border-ink-200 bg-white p-7 transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/5"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-5 flex items-center gap-1 text-lg font-bold text-ink-900">
        {feature.name}
        <ArrowUpRight className="size-4 text-ink-300 transition-colors group-hover:text-brand-600" aria-hidden="true" />
      </h3>
      <p className="mt-2 text-sm text-ink-500">{feature.short}</p>
    </Link>
  );
}
