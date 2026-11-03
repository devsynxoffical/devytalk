import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Feature } from "@/content/features";

export function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <Link
      href={`/features/${feature.slug}`}
      className="group shadow-card relative flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200"
    >
      <span className="absolute -right-10 -top-10 size-32 rounded-full bg-brand-100 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
      <span className="relative grid size-11 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 transition-colors group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-white">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="relative mt-5 flex items-center justify-between gap-2 text-[17px] font-semibold text-ink-900">
        {feature.name}
        <ArrowUpRight className="size-4 text-ink-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden="true" />
      </h3>
      <p className="relative mt-2 text-[15px] leading-relaxed text-ink-500">{feature.short}</p>
    </Link>
  );
}
