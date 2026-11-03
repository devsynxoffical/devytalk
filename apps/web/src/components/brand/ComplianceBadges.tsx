import { cn } from "@/lib/cn";

/**
 * Compliance marks drawn as simple seals. Only display the frameworks DevyTalk is actually
 * certified for or compliant with; update this list to match real audit status before launch.
 */
export const complianceBadges = [
  { id: "gdpr", label: "GDPR", sub: "EU ready" },
  { id: "iso", label: "ISO", sub: "27001" },
  { id: "soc2", label: "SOC 2", sub: "Type II" },
  { id: "hipaa", label: "HIPAA", sub: "ready" },
  { id: "pci", label: "PCI", sub: "DSS" },
  { id: "ccpa", label: "CCPA", sub: "privacy" },
] as const;

type Id = (typeof complianceBadges)[number]["id"];

export function ComplianceBadge({ id, size = "lg", tone = "ink" }: { id: Id; size?: "sm" | "lg"; tone?: "ink" | "white" }) {
  const b = complianceBadges.find((x) => x.id === id)!;
  const stars = id === "gdpr";
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(size === "lg" ? "size-20 sm:size-24" : "size-9", tone === "white" ? "text-white" : "text-ink-400")}
      role="img"
      aria-label={`${b.label} ${b.sub}`}
    >
      {id === "hipaa" ? (
        <path d="M50 6 88 20v30c0 22-16 38-38 44C28 88 12 72 12 50V20Z" fill="none" stroke="currentColor" strokeWidth="4" />
      ) : (
        <>
          <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="4" />
          {!stars && <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".6" />}
        </>
      )}
      {stars &&
        Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <circle key={i} cx={50 + Math.cos(a) * 36} cy={50 + Math.sin(a) * 36} r="2.6" fill="currentColor" />;
        })}
      <text x="50" y="52" textAnchor="middle" fontSize={b.label.length > 4 ? 17 : 21} fontWeight="800" fill="currentColor" fontFamily="inherit">
        {b.label}
      </text>
      <text x="50" y="68" textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor" opacity=".85" fontFamily="inherit">
        {b.sub}
      </text>
    </svg>
  );
}
