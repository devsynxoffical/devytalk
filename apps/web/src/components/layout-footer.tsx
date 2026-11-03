import Link from "next/link";
import { footerNav } from "@/content/nav";
import { Logo } from "@/components/ui/Logo";
import { NewsletterForm } from "@/components/interactive/NewsletterForm";
import { ComplianceBadge, complianceBadges } from "@/components/brand/ComplianceBadges";

const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com", d: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3Zm6.5 0h3.8v1.5h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4Z" },
  { label: "X", href: "https://x.com", d: "M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77Zm-1.08 16.17h1.7L7.4 4.74H5.58Z" },
  { label: "YouTube", href: "https://www.youtube.com", d: "M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-3.2.5-4.8s-.1-3.2-.5-4.8ZM9.75 15.02V8.98L15.5 12Z" },
  { label: "Instagram", href: "https://www.instagram.com", d: "M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2Zm0 4.8a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm5.2-9.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" },
];

const offices = ["London", "Berlin", "Lisbon", "New York", "Dubai", "Lahore", "Singapore"];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-ink-100 bg-white">
      <div className="container-page grid grid-cols-1 [&>*]:min-w-0 gap-12 pt-16 lg:grid-cols-[1.2fr_2.4fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-[15px] leading-relaxed text-ink-500">
            The cloud phone system with AI built in. Every call answered, by your team or by AI.
          </p>
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-ink-900">Get product updates</p>
            <NewsletterForm />
          </div>
          <ul className="mt-6 flex gap-2">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid size-9 place-items-center rounded-lg border border-ink-100 text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                    <path d={s.d} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {footerNav.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-sm font-semibold text-ink-900">{col.title}</p>
              <ul className="space-y-2.5 text-[14px] text-ink-500">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors hover:text-brand-700">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page mt-14 flex flex-col gap-6 border-t border-ink-100 pt-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-500">
          <span>© {new Date().getFullYear()} DevyTalk Ltd.</span>
          <Link href="/legal/privacy" className="hover:text-ink-900">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-ink-900">Terms</Link>
          <span className="inline-flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-brand-400 opacity-60" />
              <span className="relative size-2 rounded-full bg-brand-500" />
            </span>
            All systems operational
          </span>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Compliance">
          {complianceBadges.map((b) => (
            <li key={b.id}>
              <ComplianceBadge id={b.id} size="sm" />
            </li>
          ))}
        </ul>
      </div>
      <div className="container-page mt-4 flex flex-wrap gap-x-5 gap-y-1 pb-8 text-[13px] text-ink-400">
        <span className="font-medium text-ink-600">Offices:</span>
        {offices.map((o) => (
          <span key={o}>{o}</span>
        ))}
      </div>

      <div className="relative h-[16vw] max-h-56 min-h-24 select-none overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-200 via-sky-300/70 to-lime-300" />
        <p className="absolute inset-x-0 -bottom-[3.2vw] text-center text-[22vw] font-bold leading-none tracking-tighter text-white/60">devytalk</p>
      </div>
    </footer>
  );
}
