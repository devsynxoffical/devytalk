import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  inverted = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  inverted?: boolean;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <p className={cn("mb-3 text-sm font-bold uppercase tracking-[0.18em]", inverted ? "text-brand-300" : "text-brand-600")}>{eyebrow}</p>
      )}
      <h2 className={cn("text-3xl font-extrabold tracking-tight text-balance sm:text-4xl", inverted ? "text-white" : "text-ink-900")}>{title}</h2>
      {description && <p className={cn("mt-4 text-lg text-pretty", inverted ? "text-ink-300" : "text-ink-500")}>{description}</p>}
    </div>
  );
}
