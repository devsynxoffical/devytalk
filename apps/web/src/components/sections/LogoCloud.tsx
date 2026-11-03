import { customerLogos } from "@/content/social";
import { cn } from "@/lib/cn";

export function LogoCloud({ inverted = false, label = "Trusted by 4,000+ teams in 90 countries" }: { inverted?: boolean; label?: string }) {
  return (
    <div>
      <p className={cn("text-center text-sm font-semibold", inverted ? "text-ink-400" : "text-ink-500")}>{label}</p>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {customerLogos.map((name) => (
          <li key={name} className={cn("text-xl font-extrabold tracking-tight", inverted ? "text-white/50" : "text-ink-300")}>
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
