"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Activity, Bell, ChevronLeft, ChevronRight, CornerDownLeft, LayoutGrid, LogOut, Megaphone, Search, UserRound, type LucideIcon } from "lucide-react";
import { backendUrl, useApi } from "@/lib/api/client";
import { campaignListSchema, jobsSchema, type Campaign } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";
import { Status } from "./ui";

const SECTIONS: [string, string][] = [
  ["", "Performance"],
  ["/leads", "Leads"],
  ["/calls", "Calls"],
  ["/knowledge", "Knowledge"],
  ["/playbook", "Coach & playbook"],
  ["/experiments", "A/B tests"],
  ["/settings", "Settings"],
];
const campaignHref = (name: string, section = "") => `/dashboard/campaigns/${encodeURIComponent(name)}${section}`;

export function campaignTone(campaign: Pick<Campaign, "status" | "running" | "stop_reason">) {
  if (campaign.running) return { tone: "pos" as const, text: "Dialing", live: true };
  if (campaign.stop_reason) return { tone: "warn" as const, text: "Paused itself", live: false };
  const map = { running: ["pos", "Running"], ready: ["info", "Ready"], paused: ["warn", "Paused"], done: ["neutral", "Finished"], draft: ["neutral", "Draft"] } as const;
  const [tone, text] = map[campaign.status as keyof typeof map] ?? ["neutral", campaign.status];
  return { tone, text, live: false };
}

function Mark() {
  return (
    <span className="grid size-7 place-items-center rounded-[7px] bg-signal" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="size-4 text-on-signal" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M5 12h.5M8.5 8.5v7M12 5v14M15.5 8.5v7M19 12h.5" />
      </svg>
    </span>
  );
}

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; count?: number; alert?: boolean };

function useNav(campaignCount: number | undefined, failed: number): NavItem[] {
  return [
    { href: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone, count: campaignCount },
    { href: "/dashboard/system", label: "Background work", icon: Activity, count: failed > 0 ? failed : undefined, alert: failed > 0 },
  ];
}

const isActive = (item: NavItem, pathname: string) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/"));

// ----------------------------------------------------------------------------- command palette

type Command = { id: string; label: string; hint: string; href: string };

function CommandPalette({ campaigns, onClose }: { campaigns: Campaign[]; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  const commands = useMemo(() => {
    const all: Command[] = [
      { id: "overview", label: "Overview", hint: "Go to", href: "/dashboard" },
      { id: "campaigns", label: "Campaigns", hint: "Go to", href: "/dashboard/campaigns" },
      { id: "system", label: "Background work", hint: "Go to", href: "/dashboard/system" },
      ...campaigns.flatMap((c) => SECTIONS.map(([path, text]) => ({ id: `${c.id}${path}`, label: path ? `${c.name} › ${text}` : c.name, hint: path ? "Section" : "Campaign", href: campaignHref(c.name, path) }))),
    ];
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return all.filter((command) => words.every((word) => command.label.toLowerCase().includes(word))).slice(0, 40);
  }, [campaigns, query]);

  useEffect(() => setIndex(0), [query]);
  useEffect(() => {
    list.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  function go(command: Command | undefined) {
    if (!command) return;
    onClose();
    router.push(command.href);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[12dvh]" role="dialog" aria-modal="true" aria-label="Jump to">
      <div className="absolute inset-0 animate-fade bg-fg/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-xl animate-pop overflow-hidden rounded-overlay bg-surface shadow-overlay">
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-fg-3" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") (e.preventDefault(), setIndex((i) => Math.min(commands.length - 1, i + 1)));
              else if (e.key === "ArrowUp") (e.preventDefault(), setIndex((i) => Math.max(0, i - 1)));
              else if (e.key === "Enter") (e.preventDefault(), go(commands[index]));
              else if (e.key === "Escape") onClose();
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-label="Search campaigns and pages"
            placeholder="Search campaigns and pages"
            className="h-12 w-full bg-transparent text-[15px] text-fg placeholder:text-fg-3 focus:outline-none max-sm:text-[16px]"
          />
          <kbd className="t-figure rounded-chip border border-line px-1.5 py-0.5 text-[10.5px] text-fg-3">esc</kbd>
        </div>
        <ul ref={list} id="command-list" role="listbox" className="max-h-[50dvh] overflow-y-auto p-1.5">
          {commands.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-fg-3">Nothing matches “{query}”.</li>}
          {commands.map((command, i) => (
            <li key={command.id} role="option" aria-selected={i === index} data-index={i}>
              <button
                type="button"
                onClick={() => go(command)}
                onMouseMove={() => setIndex(i)}
                className={cn("flex w-full items-center justify-between gap-3 rounded-control px-3 py-2 text-left text-[13.5px]", i === index ? "bg-signal text-on-signal" : "text-fg-2")}
              >
                <span className="truncate">{command.label}</span>
                <span className="flex shrink-0 items-center gap-2 text-[11.5px] text-fg-3">
                  {command.hint}
                  {i === index && <CornerDownLeft className="size-3.5" aria-hidden="true" />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------- menus

function Popover({ open, onClose, children, label, className }: { open: boolean; onClose: () => void; children: ReactNode; label: string; className?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-label={label} className={cn("absolute right-0 top-[calc(100%+6px)] z-50 w-[min(22rem,calc(100vw-1.5rem))] origin-top-right animate-pop rounded-overlay border border-line bg-surface shadow-overlay", className)}>
        {children}
      </div>
    </>
  );
}

function Crumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean).slice(1); // after "dashboard"
  const crumbs: { label: string; href: string }[] = [];
  if (parts[0] === "campaigns") {
    crumbs.push({ label: "Campaigns", href: "/dashboard/campaigns" });
    if (parts[1]) {
      const name = decodeURIComponent(parts[1]);
      crumbs.push({ label: name, href: campaignHref(name) });
      const section = SECTIONS.find(([path]) => path === `/${parts[2] ?? ""}`);
      if (parts[2] && section) crumbs.push({ label: section[1], href: campaignHref(name, section[0]) });
    }
  } else if (parts[0] === "system") crumbs.push({ label: "Background work", href: "/dashboard/system" });
  else crumbs.push({ label: "Overview", href: "/dashboard" });
  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2] : null;
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1">
      {parent && (
        <Link href={parent.href} aria-label={`Back to ${parent.label}`} className="-ml-1 grid size-8 shrink-0 place-items-center rounded-control text-fg-2 hover:bg-sunken md:hidden">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      )}
      <ol className="flex min-w-0 items-center gap-1 text-[13px]">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={crumb.href}>
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-fg-3 max-md:hidden" aria-hidden="true" />}
              <li className={cn("min-w-0", !last && "max-md:hidden")}>
                {last ? (
                  <span aria-current="page" className="block truncate font-medium text-fg">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="block truncate text-fg-3 hover:text-fg">
                    {crumb.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

// ----------------------------------------------------------------------------- shell

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState<"attention" | "account" | null>(null);
  const [leaving, setLeaving] = useState(false);
  // Counts and the campaign list for navigation. If either fails, navigation still works; the pages report errors.
  const campaigns = useApi(backendUrl(["campaigns"]), campaignListSchema);
  const jobs = useApi(backendUrl(["jobs"], { limit: 1 }), jobsSchema);

  useEffect(() => {
    setMenu(null);
    setPalette(false);
  }, [pathname]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette((open) => !open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function signOut() {
    setLeaving(true);
    await fetch("/api/session", { method: "DELETE" }).catch(() => undefined);
    router.replace("/login");
  }

  const failed = jobs.data?.stats.dead ?? 0;
  const nav = useNav(campaigns.data?.length, failed);
  const paused = campaigns.data?.filter((c) => c.stop_reason) ?? [];
  const alerts = failed + paused.length;
  const recent = campaigns.data?.slice(0, 6) ?? [];

  return (
    <div className="app min-h-dvh">
      {/* Rail: labels from 1024px, icons only on tablets, replaced by the tab bar on phones. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col border-r border-line bg-rail text-rail-fg md:flex lg:w-56">
        <Link href="/dashboard" className="flex h-14 items-center gap-2.5 px-[18px] lg:px-4" aria-label="DevyTalk">
          <Mark />
          <span className="hidden text-[15px] font-semibold tracking-tight text-fg lg:block">DevyTalk</span>
        </Link>
        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2.5 pb-4 pt-2">
          <ul className="space-y-0.5">
            {nav.map((item) => {
              const active = isActive(item, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn("group relative flex h-9 items-center gap-2.5 rounded-control px-2.5 text-[13.5px] transition-colors max-lg:justify-center", active ? "bg-signal font-medium text-on-signal" : "hover:bg-rail-2 hover:text-fg")}
                  >
                                        <item.icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate max-lg:sr-only">{item.label}</span>
                    {item.count !== undefined && (
                      <span className={cn("t-figure rounded-chip px-1.5 text-[11px] max-lg:absolute max-lg:right-1 max-lg:top-0.5", item.alert ? "bg-crit-mark text-white" : active ? "bg-white/20 text-on-signal" : "bg-sunken text-fg-2")}>{item.count}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          {recent.length > 0 && (
            <div className="mt-6 hidden lg:block">
              <p className="px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-3">Campaigns</p>
              <ul className="mt-1.5 space-y-0.5">
                {recent.map((c) => {
                  const state = campaignTone(c);
                  const active = pathname.startsWith(campaignHref(c.name));
                  return (
                    <li key={c.id}>
                      <Link href={campaignHref(c.name)} className={cn("flex h-8 items-center gap-2.5 rounded-control px-2.5 text-[13px] transition-colors", active ? "bg-rail-2 font-medium text-fg" : "hover:bg-rail-2 hover:text-fg")}>
                        <span
                          className={cn("size-1.5 shrink-0 rounded-[1px]", state.live ? "animate-live bg-signal" : state.tone === "warn" ? "bg-warn-mark" : state.tone === "info" ? "bg-info-mark" : "bg-fg-3")}
                          aria-hidden="true"
                        />
                        <span className="truncate">{c.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </nav>
        <p className="hidden border-t border-line px-4 py-3 text-[11.5px] leading-4 text-fg-3 lg:block">Sales calling console</p>
      </aside>

      <div className="md:pl-16 lg:pl-56">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur pt-safe sm:px-6">
          <span className="md:hidden">
            <Mark />
          </span>
          <Crumbs pathname={pathname} />
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPalette(true)}
              aria-label="Search campaigns and pages"
              className="flex h-8 items-center gap-2 rounded-control border border-line-strong bg-surface px-2.5 text-[13px] text-fg-3 transition-colors hover:border-fg-3 hover:text-fg sm:w-56"
            >
              <Search className="size-3.5" aria-hidden="true" />
              <span className="flex-1 text-left max-sm:hidden">Search</span>
              <kbd className="t-figure rounded-chip border border-line px-1 text-[10.5px] max-sm:hidden" aria-hidden="true">
                ⌘K
              </kbd>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu(menu === "attention" ? null : "attention")}
                aria-expanded={menu === "attention"}
                aria-label={alerts > 0 ? `${alerts} ${alerts === 1 ? "item needs" : "items need"} your attention` : "Nothing needs your attention"}
                className="relative grid size-8 place-items-center rounded-control text-fg-2 hover:bg-sunken hover:text-fg"
              >
                <Bell className="size-4" aria-hidden="true" />
                {alerts > 0 && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-crit-mark ring-2 ring-paper" aria-hidden="true" />}
              </button>
              <Popover open={menu === "attention"} onClose={() => setMenu(null)} label="Needs attention">
                <p className="t-eyebrow border-b border-line px-4 py-2.5">Needs attention</p>
                {alerts === 0 ? (
                  <p className="px-4 py-5 text-[13px] text-fg-2">Nothing is waiting for you.</p>
                ) : (
                  <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                    {failed > 0 && (
                      <li>
                        <Link href="/dashboard/system" className="block px-4 py-3 hover:bg-sunken">
                          <Status tone="crit">
                            {failed} background {failed === 1 ? "job" : "jobs"} gave up
                          </Status>
                          <p className="t-meta mt-0.5">See why and run them again.</p>
                        </Link>
                      </li>
                    )}
                    {paused.map((c) => (
                      <li key={c.id}>
                        <Link href={campaignHref(c.name)} className="block px-4 py-3 hover:bg-sunken">
                          <Status tone="warn">{c.name} paused itself</Status>
                          <p className="t-meta mt-0.5 line-clamp-2">{c.stop_reason}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Popover>
            </div>

            <div className="relative max-md:hidden">
              <button
                type="button"
                onClick={() => setMenu(menu === "account" ? null : "account")}
                aria-expanded={menu === "account"}
                aria-label="Account"
                className="grid size-8 place-items-center rounded-control bg-signal text-[11px] font-semibold text-on-signal hover:bg-accent-strong"
              >
                OP
              </button>
              <Popover open={menu === "account"} onClose={() => setMenu(null)} label="Account" className="w-64">
                <div className="border-b border-line px-4 py-3">
                  <p className="text-[13.5px] font-semibold text-fg">Operator</p>
                  <p className="t-meta mt-0.5">Signed in with the engine&apos;s access token</p>
                </div>
                <div className="p-1.5">
                  <button type="button" onClick={signOut} disabled={leaving} className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-left text-[13.5px] text-fg-2 hover:bg-sunken hover:text-fg disabled:opacity-50">
                    <LogOut className="size-4" aria-hidden="true" /> Sign out
                  </button>
                </div>
              </Popover>
            </div>
          </div>
        </header>

        <main id="main" key={pathname} className="mx-auto w-full max-w-[1480px] animate-rise px-4 pb-28 pt-5 sm:px-6 md:pb-12">
          {children}
        </main>
      </div>

      {/* Phones: the four destinations as a tab bar within thumb reach. */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur pb-safe md:hidden">
        <ul className="grid grid-cols-4">
          {nav.map((item) => {
            const active = isActive(item, pathname);
            return (
              <li key={item.href}>
                <Link href={item.href} aria-current={active ? "page" : undefined} className={cn("relative flex h-14 flex-col items-center justify-center gap-1 text-[10.5px] font-medium", active ? "text-fg" : "text-fg-3")}>
                  {active && <span className="absolute inset-x-5 top-0 h-[3px] rounded-b bg-signal" aria-hidden="true" />}
                  <span className="relative">
                    <item.icon className="size-5" aria-hidden="true" />
                    {item.alert && <span className="absolute -right-1 -top-0.5 size-2 rounded-full bg-crit-mark ring-2 ring-surface" aria-hidden="true" />}
                  </span>
                  {item.label === "Background work" ? "Work" : item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMenu(menu === "account" ? null : "account")} aria-expanded={menu === "account"} className={cn("flex h-14 w-full flex-col items-center justify-center gap-1 text-[10.5px] font-medium", menu === "account" ? "text-fg" : "text-fg-3")}>
              <UserRound className="size-5" aria-hidden="true" />
              Account
            </button>
          </li>
        </ul>
        {menu === "account" && (
          <>
            <div className="fixed inset-0 -z-10 animate-fade bg-fg/35" onClick={() => setMenu(null)} aria-hidden="true" />
            <div role="dialog" aria-label="Account" className="absolute inset-x-0 bottom-full animate-sheet-up rounded-t-overlay border-t border-line bg-surface p-4 shadow-overlay">
              <p className="text-[14px] font-semibold text-fg">Operator</p>
              <p className="t-meta mt-0.5">Signed in with the engine&apos;s access token</p>
              <button type="button" onClick={signOut} disabled={leaving} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-control border border-line-strong text-[14px] font-medium text-fg">
                <LogOut className="size-4" aria-hidden="true" /> Sign out
              </button>
            </div>
          </>
        )}
      </nav>

      {palette && <CommandPalette campaigns={campaigns.data ?? []} onClose={() => setPalette(false)} />}
    </div>
  );
}
