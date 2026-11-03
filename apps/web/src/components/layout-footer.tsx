import Link from "next/link";
import { footerNav } from "@/content/nav";
import { Logo } from "@/components/ui/Logo";
import { NewsletterForm } from "@/components/interactive/NewsletterForm";

export function Footer() {
  return (
    <footer className="bg-ink-950 text-ink-300">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm">
          <Logo inverted />
          <p className="mt-4 text-sm">
            The cloud phone system and AI call center for teams that sell and support over the phone.
          </p>
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-white">Get product updates</p>
            <NewsletterForm />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {footerNav.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-sm font-bold text-white">{col.title}</p>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors hover:text-brand-300">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} DevyTalk. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-brand-400" aria-hidden="true" /> All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}
