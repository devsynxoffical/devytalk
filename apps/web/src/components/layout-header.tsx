"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { mainNav } from "@/content/nav";
import { Logo } from "@/components/ui/Logo";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(null);
    setMobile(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(null), setMobile(false));
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const solid = scrolled || mobile;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        solid ? "border-b border-white/10 bg-ink-900/90 backdrop-blur-lg" : "bg-transparent",
      )}
    >
      <div className="container-page flex h-18 items-center justify-between gap-6">
        <Logo inverted />

        <nav ref={navRef} className="relative hidden items-center gap-1 lg:flex" aria-label="Main">
          {mainNav.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  pathname.startsWith(item.href) ? "text-brand-300" : "text-ink-200 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <div key={item.label} onMouseEnter={() => setOpen(item.label)} onMouseLeave={() => setOpen(null)}>
                <button
                  type="button"
                  aria-expanded={open === item.label}
                  onClick={() => setOpen(open === item.label ? null : item.label)}
                  className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-ink-200 transition-colors hover:text-white"
                >
                  {item.label}
                  <ChevronDown className={cn("size-4 transition-transform", open === item.label && "rotate-180")} aria-hidden="true" />
                </button>
                {open === item.label && item.columns && (
                  <div className="absolute left-1/2 top-full -translate-x-1/2 pt-3">
                    <div
                      className={cn(
                        "grid gap-6 rounded-2xl border border-ink-200 bg-white p-6 shadow-2xl shadow-ink-950/20",
                        item.columns.length === 3 ? "w-[52rem] grid-cols-3" : "w-[26rem] grid-cols-1",
                      )}
                    >
                      {item.columns.map((col) => (
                        <div key={col.title}>
                          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-400">{col.title}</p>
                          <ul className="space-y-1">
                            {col.links.map((link) => (
                              <li key={link.href}>
                                <Link href={link.href} className="block rounded-xl p-2.5 transition-colors hover:bg-brand-50">
                                  <span className="block text-sm font-semibold text-ink-900">{link.label}</span>
                                  {link.description && <span className="mt-0.5 block text-xs text-ink-500">{link.description}</span>}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login" className="px-3 text-sm font-semibold text-ink-200 hover:text-white">
            Log in
          </Link>
          <Link href="/demo" className={buttonClass("light", "sm")}>
            Book a demo
          </Link>
          <Link href="/signup" className={buttonClass("accent", "sm")}>
            Start free trial
          </Link>
        </div>

        <button
          type="button"
          className="grid size-10 place-items-center rounded-full text-white lg:hidden"
          aria-label={mobile ? "Close menu" : "Open menu"}
          aria-expanded={mobile}
          onClick={() => setMobile((v) => !v)}
        >
          {mobile ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {mobile && (
        <div className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-white/10 bg-ink-900 lg:hidden">
          <nav className="container-page space-y-1 py-4" aria-label="Mobile">
            {mainNav.map((item) =>
              item.href ? (
                <Link key={item.label} href={item.href} className="block rounded-xl px-3 py-3 font-semibold text-white hover:bg-white/5">
                  {item.label}
                </Link>
              ) : (
                <details key={item.label} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-3 font-semibold text-white hover:bg-white/5">
                    {item.label}
                    <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-1 pb-2 pl-3">
                    {item.columns?.flatMap((c) => c.links).map((link) => (
                      <Link key={link.href} href={link.href} className="block rounded-lg px-3 py-2 text-sm text-ink-300 hover:text-white">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ),
            )}
            <div className="grid gap-2 pt-4">
              <Link href="/signup" className={buttonClass("accent", "md")}>
                Start free trial
              </Link>
              <Link href="/demo" className={buttonClass("light", "md")}>
                Book a demo
              </Link>
              <Link href="/login" className="py-2 text-center text-sm font-semibold text-ink-300">
                Log in
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
