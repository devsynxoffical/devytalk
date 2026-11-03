import type { ReactNode } from "react";
import { Webhook } from "lucide-react";
import { brandIcons } from "@/content/brand-icons";
import { cn } from "@/lib/cn";

function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

/** App-store style tile for an integration: brand color background with the white (or dark) mark. */
/** Simple stand-in marks for brands without an icon in brandIcons. */
const customMarks: Record<string, ReactNode> = {
  Salesforce: <path d="M10 5.5a4 4 0 0 1 3.2 1.6 3.4 3.4 0 0 1 4.8 1.5A3.8 3.8 0 0 1 19 16a3.2 3.2 0 0 1-4.6 1.8 3.6 3.6 0 0 1-6.3.4A3.4 3.4 0 0 1 4 15.4a3.5 3.5 0 0 1 1.4-6A4 4 0 0 1 10 5.5Z" />,
  "Microsoft Dynamics": <path d="M3 3h8.5v8.5H3Zm9.5 0H21v8.5h-8.5ZM3 12.5h8.5V21H3Zm9.5 0H21V21h-8.5Z" />,
  "Microsoft Teams": <path d="M3 3h8.5v8.5H3Zm9.5 0H21v8.5h-8.5ZM3 12.5h8.5V21H3Zm9.5 0H21V21h-8.5Z" />,
};

const glyphs: Record<string, string> = { Pipedrive: "p", Freshdesk: "fd", Gorgias: "G", "REST API": "{ }", Slack: "#" };

export function AppIcon({ icon, name, color, size = "md", className }: { icon?: string; name: string; color: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const brand = icon ? brandIcons[icon] : undefined;
  const bg = brand?.hex ?? color;
  const light = isLight(bg);
  const dims = { sm: "size-10 rounded-xl", md: "size-14 rounded-2xl", lg: "size-16 rounded-[1.1rem]" }[size];
  const inner = { sm: "size-5", md: "size-7", lg: "size-8" }[size];
  return (
    <span
      className={cn("grid shrink-0 place-items-center shadow-[inset_0_-2px_0_rgb(0_0_0/0.08)]", dims, light ? "text-ink-900" : "text-white", className)}
      style={{ backgroundColor: bg }}
      role="img"
      aria-label={name}
    >
      {name === "Webhooks" ? (
        <Webhook className={inner} aria-hidden="true" />
      ) : customMarks[name] ? (
        <svg viewBox="0 0 24 24" className={inner} fill="currentColor" aria-hidden="true">
          {customMarks[name]}
        </svg>
      ) : brand ? (
        <svg viewBox="0 0 24 24" className={inner} fill="currentColor" aria-hidden="true">
          <path d={brand.path} />
        </svg>
      ) : (
        <span className={cn("font-bold leading-none tracking-tight", glyphs[name] ? (size === "sm" ? "text-base" : "text-2xl") : size === "sm" ? "text-xs" : "text-sm")}>
          {glyphs[name] ?? monogram(name)}
        </span>
      )}
    </span>
  );
}

function monogram(name: string) {
  const words = name.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}
