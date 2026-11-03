"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, Sparkles, X } from "lucide-react";
import { mainNav, type NavItem, type NavLink } from "@/content/nav";
import { Logo } from "@/components/ui/Logo";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const OPEN_DELAY = 70;
const CLOSE_DELAY = 140;

function MenuLink({ link, index }: { link: NavLink; index: number }) {
  const Icon = link.icon;
  return (
    <li className="animate-[menuItem_.35s_cubic-bezier(.2,.8,.2,1)_both]" style={{ animationDelay: `${40 + index * 25}ms` }}>
      <Link href={link.href} className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors duration-200 hover:bg-ink-50">
        {Icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-ink-100 bg-white text-ink-600 shadow-[0_1px_2px_rgb(10_22_40/0.05)] transition-all duration-200 group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-white">
            <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-[14px] font-semibold leading-5 text-ink-900">{link.label}</span>
          {link.description && <span className="block truncate text-[13px] leading-5 text-ink-500">{link.description}</span>}
        </span>
      </Link>
    </li>
  );
}

function MegaPanel({ item }: { item: NavItem }) {
  const cols = item.columns ?? [];
  const singleColumnGrid = cols.length === 1 && cols[0].links.length > 4;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-[0_24px_64px_-16px_rgb(10_22_40/0.22),0_2px_6px_rgb(10_22_40/0.04)]",
        cols.length === 2 ? "w-[60rem]" : singleColumnGrid ? "w-[50rem]" : "w-[40rem]",
      )}
    >
      <div className="flex gap-2 p-3">
        <div className={cn("grid flex-1 gap-2", cols.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
          {cols.map((col, ci) => (
            <div key={col.title} className="p-2">
              <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">{col.title}</p>
              <ul className={cn("space-y-0.5", singleColumnGrid && "grid grid-cols-2 gap-x-1 space-y-0")}>
                {col.links.map((link, i) => (
                  <MenuLink key={link.href} link={link} index={ci * 6 + i} />
                ))}
              </ul>
            </div>
          ))}
        </div>
        {item.featured && (
          <Link
            href={item.featured.href}
            className="group bg-mesh-dark relative flex w-64 shrink-0 animate-[menuItem_.45s_cubic-bezier(.2,.8,.2,1)_both] flex-col overflow-hidden rounded-xl p-5 text-white"
            style={{ animationDelay: "90ms" }}
          >
            <div className="bg-dots absolute inset-0 opacity-25 invert" aria-hidden="true" />
            <span className="relative inline-flex w-fit items-center gap-1 rounded-full bg-lime-400 px-2 py-0.5 text-[11px] font-bold text-ink-900">
              <Sparkles className="size-3" aria-hidden="true" /> {item.featured.eyebrow}
            </span>
            <div className="relative mt-auto pt-16">
              <div className="mb-4 flex h-8 items-end gap-[3px]" aria-hidden="true">
                {[30, 60, 40, 85, 55, 95, 45, 70, 35, 80, 50, 65].map((h, i) => (
                  <span key={i} className="w-1 origin-bottom animate-[eq_1.2s_ease-in-out_infinite] rounded-full bg-white/70" style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }} />
                ))}
              </div>
              <p className="text-[15px] font-semibold leading-snug">{item.featured.title}</p>
              <p className="mt-1.5 text-[13px] leading-snug text-white/70">{item.featured.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-lime-300">
                {item.featured.cta}
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </Link>
        )}
      </div>
      {item.footer && (
        <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50/60 px-5 py-3 text-[13px]">
          <Link href={item.footer.href} className="group inline-flex items-center gap-1.5 font-semibold text-ink-900 hover:text-brand-700">
            {item.footer.label}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <span className="text-ink-500">
            Not sure where to start?{" "}
            <Link href="/demo" className="font-semibold text-brand-700 hover:underline">
              Book a demo
            </Link>
          </span>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [pill, setPill] = useState<{ left: number; width: number; show: boolean }>({ left: 0, width: 0, show: false });
  const navRef = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  const openMenu = useCallback((label: string) => {
    clear();
    timer.current = setTimeout(() => {
      setActive(label);
      setVisible(true);
    }, OPEN_DELAY);
  }, []);

  const closeMenu = useCallback((delay = CLOSE_DELAY) => {
    clear();
    timer.current = setTimeout(() => {
      setVisible(false);
      timer.current = setTimeout(() => setActive(null), 180);
    }, delay);
  }, []);

  const movePill = (el: HTMLElement) => {
    const nav = navRef.current;
    if (!nav) return;
    const a = el.getBoundingClientRect();
    const b = nav.getBoundingClientRect();
    setPill({ left: a.left - b.left, width: a.width, show: true });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    clear();
    setVisible(false);
    setActive(null);
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
        closeMenu(0);
        setMobile(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeMenu]);

  useEffect(() => clear, []);

  const activeItem = mainNav.find((i) => i.label === active);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className={cn("overflow-hidden transition-[max-height,opacity] duration-300", scrolled ? "max-h-0 opacity-0" : "max-h-10 opacity-100")}>
        <Link
          href="/features/ai-voice-agent"
          className="group flex h-9 items-center justify-center gap-2 bg-gradient-to-r from-brand-50 via-white to-lime-300/30 px-4 text-[13px] text-ink-700"
        >
          <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime-300">New</span>
          <span className="truncate">Devy, our AI Voice Agent, now answers in 30+ languages</span>
          <ArrowRight className="hidden size-3.5 text-brand-700 transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
        </Link>
      </div>

      <div
        className={cn(
          "border-b transition-all duration-300",
          scrolled || mobile || visible ? "border-ink-100 bg-white/85 backdrop-blur-xl" : "border-transparent bg-white/0",
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-6">
          <Logo />

          <div className="relative hidden lg:block" onMouseLeave={() => closeMenu()} onMouseEnter={clear}>
            <nav
              ref={navRef}
              aria-label="Main"
              className="relative flex items-center gap-0.5"
              onMouseLeave={() => setPill((p) => ({ ...p, show: false }))}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute top-1/2 h-9 -translate-y-1/2 rounded-lg bg-ink-100/70 transition-all duration-300 ease-[cubic-bezier(.2,.8,.2,1)]",
                  pill.show || visible ? "opacity-100" : "opacity-0",
                )}
                style={{ left: pill.left, width: pill.width }}
              />
              {mainNav.map((item) =>
                item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    onMouseEnter={(e) => {
                      movePill(e.currentTarget);
                      closeMenu(0);
                    }}
                    onFocus={(e) => movePill(e.currentTarget)}
                    className={cn(
                      "relative rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors",
                      pathname.startsWith(item.href) ? "text-brand-700" : "text-ink-700 hover:text-ink-900",
                    )}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    aria-expanded={visible && active === item.label}
                    aria-haspopup="true"
                    onMouseEnter={(e) => {
                      movePill(e.currentTarget);
                      openMenu(item.label);
                    }}
                    onFocus={(e) => movePill(e.currentTarget)}
                    onClick={(e) => {
                      movePill(e.currentTarget);
                      if (visible && active === item.label) closeMenu(0);
                      else {
                        clear();
                        setActive(item.label);
                        setVisible(true);
                      }
                    }}
                    className={cn(
                      "relative inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-[14px] font-medium transition-colors",
                      visible && active === item.label ? "text-ink-900" : "text-ink-700 hover:text-ink-900",
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn("size-3.5 opacity-60 transition-transform duration-300", visible && active === item.label && "rotate-180")}
                      aria-hidden="true"
                    />
                  </button>
                ),
              )}
            </nav>

            {activeItem?.columns && (
              <div
                className={cn(
                  "absolute left-1/2 top-full origin-top pt-3 transition-all duration-200 ease-[cubic-bezier(.2,.8,.2,1)]",
                  visible ? "opacity-100" : "pointer-events-none opacity-0",
                )}
                style={{ transform: `translateX(-50%) translateY(${visible ? 0 : -6}px) scale(${visible ? 1 : 0.98})` }}
              >
                <div key={activeItem.label} className="animate-[menuPanel_.25s_cubic-bezier(.2,.8,.2,1)]">
                  <MegaPanel item={activeItem} />
                </div>
              </div>
            )}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/login" className="rounded-lg px-3 py-2 text-[14px] font-medium text-ink-700 transition-colors hover:text-ink-900">
              Log in
            </Link>
            <Link href="/demo" className={buttonClass("outline", "sm")}>
              Book a demo
            </Link>
            <Link href="/signup" className={buttonClass("dark", "sm", "group")}>
              Start free
              <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
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
          <div className="h-[calc(100dvh-4rem)] animate-[menuPanel_.25s_ease] overflow-y-auto border-t border-ink-100 bg-white lg:hidden">
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
                    <ul className="space-y-0.5 pb-2 pl-1">
                      {item.columns
                        ?.flatMap((c) => c.links)
                        .map((link) => {
                          const Icon = link.icon;
                          return (
                            <li key={link.href}>
                              <Link href={link.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] text-ink-700 hover:bg-brand-50 hover:text-brand-700">
                                {Icon && <Icon className="size-4 text-ink-400" aria-hidden="true" />}
                                {link.label}
                              </Link>
                            </li>
                          );
                        })}
                    </ul>
                  </details>
                ),
              )}
              <div className="grid gap-2 border-t border-ink-100 pt-5">
                <Link href="/signup" className={buttonClass("dark", "lg")}>
                  Start free
                </Link>
                <Link href="/demo" className={buttonClass("outline", "lg")}>
                  Book a demo
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
