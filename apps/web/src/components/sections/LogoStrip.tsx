import { LogoMarquee } from "@/components/brand/CustomerLogos";

export function LogoStrip({ label = "Trusted by 4,000+ sales and support teams in 90 countries" }: { label?: string }) {
  return (
    <div>
      <p className="text-center text-sm font-medium text-ink-500">{label}</p>
      <LogoMarquee className="mt-7" />
    </div>
  );
}
