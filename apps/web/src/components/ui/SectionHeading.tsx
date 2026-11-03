import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Eyebrow } from "./Eyebrow";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** center: stacked & centered. split: title left, description right (CloudTalk-style). left: stacked left. */
  layout?: "center" | "split" | "left";
  className?: string;
};

export function SectionHeading({ eyebrow, title, description, layout = "center", className }: Props) {
  if (layout === "split") {
    return (
      <div className={cn("grid gap-6 md:grid-cols-2 md:items-end md:gap-16", className)}>
        <div>
          {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
          <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-balance text-ink-900 sm:text-[2.6rem]">{title}</h2>
        </div>
        {description && <p className="text-lg leading-relaxed text-ink-500 text-pretty">{description}</p>}
      </div>
    );
  }
  return (
    <div className={cn("max-w-2xl", layout === "center" && "mx-auto text-center", className)}>
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-balance text-ink-900 sm:text-[2.6rem]">{title}</h2>
      {description && <p className="mt-4 text-lg leading-relaxed text-ink-500 text-pretty">{description}</p>}
    </div>
  );
}
