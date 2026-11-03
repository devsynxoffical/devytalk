"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
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
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(null);
    setMobile(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobile]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobile(false);
      }
    };
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

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className={cn("overflow-hidden bg-ink-900 text-white transition-[max-height] duration-300", scrolled ? "max-h-0" : "max-h-10")}>
        <Link href="/features/ai-voice-agent" className="container-page flex h-10 items-center justify-center gap-2 text-[13px]">
          <span className="rounded-full bg-lime-400 px-2 py-0.5 text-[11px] font-bold text-ink-900">New</span>
          <span className="truncate text-white/80">AI Voice Agent: answer every call, 24/7, in 30+ languages.</span>
          <span className="hidden items-center gap-1 font-semibold sm:inline-flex">
            Learn more <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
        </Link>
      </div>

      <div className={cn("border-b bg-white/90 backdrop-blur-xl transition-colors", scrolled || mobile ? "border-ink-100" : "border-transparent")}>
        <div className="container-page flex h-16 items-center justify-between gap-6">
          <Logo />

          <nav ref={navRef} className="relative hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {mainNav.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors",
                    pathname.startsWith(item.href) ? "text-brand-700" : "text-ink-700 hover:bg-ink-50 hover:text-ink-900",
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
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors",
                      open === item.label ? "bg-ink-50 text-ink-900" : "text-ink-700 hover:text-ink-900",
                    )}
                  >
                    {item.label}
                    <ChevronDown className={cn("size-3.5 transition-transform", open === item.label && "rotate-180")} aria-hidden="true" />
                  </button>
                  {open === item.label && item.columns && (
                    <div className="absolute left-1/2 top-full -translate-x-1/2 pt-3">
                      <div
                        className={cn(
                          "shadow-float grid gap-2 rounded-2xl border border-ink-100 bg-white p-3",
                          item.columns.length === 3 ? "w-[54rem] grid-cols-3" : "w-[30rem] grid-cols-1",
                        )}
                      >
                        {item.columns.map((col) => (
                          <div key={col.title} className="p-2">
                            <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">{col.title}</p>
                            <ul className={cn(item.columns!.length === 1 && col.links.length > 4 && "grid grid-cols-2")}>
                              {col.links.map((link) => (
                                <li key={link.href}>
                                  <Link href={link.href} className="group block rounded-xl px-2.5 py-2 transition-colors hover:bg-brand-50">
                                    <span className="block text-[14px] font-semibold text-ink-900 group-hover:text-brand-700">{link.label}</span>
                                    {link.description && <span className="mt-0.5 block text-xs leading-snug text-ink-500">{link.description}</span>}
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
            <Link href="/login" className="rounded-lg px-3 py-2 text-[14px] font-medium text-ink-700 hover:text-ink-900">
              Log in
            </Link>
            <Link href="/signup" className={buttonClass("outline", "sm")}>
              Start free trial
            </Link>
            <Link href="/demo" className={buttonClass("primary", "sm")}>
              Book a demo
            </Link>
          </div>

          <button
            type="button"
            className="grid size-10 place-items-center rounded-lg text-ink-900 hover:bg-ink-50 lg:hidden"
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-expanded={mobile}
            onClick={() => setMobile((v) => !v)}
          >
            {mobile ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {mobile && (
          <div className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-ink-100 bg-white lg:hidden">
            <nav className="container-page space-y-1 py-4" aria-label="Mobile">
              {mainNav.map((item) =>
                item.href ? (
                  <Link key={item.label} href={item.href} className="block rounded-xl px-3 py-3 text-[17px] font-semibold text-ink-900 hover:bg-ink-50">
                    {item.label}
                  </Link>
                ) : (
                  <details key={item.label} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-3 text-[17px] font-semibold text-ink-900 hover:bg-ink-50 [&::-webkit-details-marker]:hidden">
                      {item.label}
                      <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="space-y-0.5 pb-2 pl-3">
                      {item.columns?.flatMap((c) => c.links).map((link) => (
                        <Link key={link.href} href={link.href} className="block rounded-lg px-3 py-2 text-[15px] text-ink-600 hover:bg-brand-50 hover:text-brand-700">
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </details>
                ),
              )}
              <div className="grid gap-2 border-t border-ink-100 pt-5">
                <Link href="/demo" className={buttonClass("primary", "lg")}>
                  Book a demo
                </Link>
                <Link href="/signup" className={buttonClass("outline", "lg")}>
                  Start free trial
                </Link>
                <Link href="/login" className="py-2 text-center text-sm font-semibold text-ink-600">
                  Log in
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
