"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bell, Check, ChevronLeft, ChevronRight, CornerDownLeft, Ellipsis, KeyRound, LogOut, Search, UserRound } from "lucide-react";
import { GLOSSARY } from "@/content/console-help";
import { backendUrl, useApi } from "@/lib/api/client";
import { campaignListSchema, jobsSchema, statusSchema, websiteRequestListSchema, type Campaign, type Me } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";
import { useTheme } from "@/lib/hooks/useTheme";
import { THEME_CHOICES } from "@/lib/theme";
import { AccessProvider, ROLE_LABEL, initials, useAccess } from "./access";
import { GROUP_TITLE, PLACES, canSee, isAt, placeAt, type Place } from "./nav";
import { Segmented, Status } from "./ui";

const SECTIONS: [string, string][] = [
  ["", "Performance"],
  ["/leads", "Leads"],
  ["/calls", "Calls"],
  ["/knowledge", "Knowledge"],
  ["/playbook", "Coach & playbook"],
  ["/experiments", "A/B tests"],
  ["/settings", "Settings"],
];
/** Other words people search a campaign section by. None repeats another section's name. */
const SECTION_WORDS: Record<string, string> = {
  "": "results report objections",
  "/leads": "people import sheet scores",
  "/calls": "transcripts log recordings call one number",
  "/knowledge": "documents website upload files",
  "/playbook": "script versions approve draft",
  "/experiments": "test compare versions",
  "/settings": "rules budget schedule hours days languages inbound number export limits",
};
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

/** A count or a state shown at the end of a navigation row. */
type Badge = { text: string; tone: "plain" | "alert" | "warn" | "done" };

// ----------------------------------------------------------------------------- search

type Command = { id: string; label: string; hint: string; href: string; words: string };

/** Search over every page, every campaign section and every word the Help page explains. */
function CommandPalette({ campaigns, places, canCreate, onClose }: { campaigns: Campaign[]; places: Place[]; canCreate: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const list = useRef<HTMLUListElement>(null);

  const commands = useMemo(() => {
    const all: Command[] = [
      ...places.map((place) => ({ id: place.href, label: place.label, hint: place.about, href: place.href, words: `${place.label} ${place.keywords ?? ""}` })),
      ...(canCreate ? [{ id: "new-campaign", label: "New campaign", hint: "Create", href: "/dashboard/campaigns/new", words: "new campaign create add start" }] : []),
      ...campaigns.flatMap((c) => SECTIONS.map(([path, text]) => ({ id: `${c.id}${path}`, label: path ? `${c.name} › ${text}` : c.name, hint: path ? "Section" : "Campaign", href: campaignHref(c.name, path), words: `${c.name} ${path ? text : ""} ${SECTION_WORDS[path] ?? ""}` }))),
      ...GLOSSARY.map((term) => ({ id: `term-${term.id}`, label: `What is “${term.term.toLowerCase()}”?`, hint: "Help", href: `/dashboard/help#${term.id}`, words: `what is ${term.term} meaning explain` })),
    ];
    const wanted = query.toLowerCase().split(/\s+/).filter(Boolean);
    return all.filter((command) => wanted.every((word) => command.words.toLowerCase().includes(word))).slice(0, 40);
  }, [campaigns, places, canCreate, query]);

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
      <div className="absolute inset-0 animate-fade bg-scrim" onClick={onClose} aria-hidden="true" />
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
            placeholder="Search campaigns, pages and help"
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
                <span className="shrink-0 truncate font-medium">{command.label}</span>
                <span className={cn("flex min-w-0 items-center gap-2 text-[11.5px]", i === index ? "text-on-signal/80" : "text-fg-3")}>
                  <span className="truncate">{command.hint}</span>
                  {i === index && <CornerDownLeft className="size-3.5 shrink-0" aria-hidden="true" />}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-4 py-2 text-[11.5px] text-fg-3 max-sm:hidden">
          <kbd className="t-figure">↑</kbd> <kbd className="t-figure">↓</kbd> to move · <kbd className="t-figure">Enter</kbd> to open
        </p>
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
    if (parts[1] === "new" && !parts[2]) crumbs.push({ label: "New campaign", href: "/dashboard/campaigns/new" });
    else if (parts[1]) {
      const name = decodeURIComponent(parts[1]);
      crumbs.push({ label: name, href: campaignHref(name) });
      const section = SECTIONS.find(([path]) => path === `/${parts[2] ?? ""}`);
      if (parts[2] && section) crumbs.push({ label: section[1], href: campaignHref(name, section[0]) });
    }
  } else if (parts[0] === "account") crumbs.push({ label: "Your account", href: "/dashboard/account" });
  else {
    const place = placeAt(pathname) ?? PLACES[0];
    crumbs.push({ label: place.label, href: place.href });
  }
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

function Identity({ me }: { me: Me | null }) {
  if (!me) return <p className="t-meta">Loading your account</p>;
  return (
    <>
      <p className="truncate text-[13.5px] font-semibold text-fg">{me.kind === "token" ? "Engine access token" : me.name || me.email}</p>
      <p className="t-meta mt-0.5 truncate">{me.kind === "token" ? "The operator's credential, with full access" : me.email}</p>
      {me.organization.name && (
        <p className="t-meta mt-0.5 truncate" data-testid="organization">
          {me.organization.name === "default" ? "Default organization" : me.organization.name}
        </p>
      )}
      <p className="mt-1.5">
        <Status tone={me.role === "admin" ? "pos" : me.role === "operator" ? "info" : "neutral"}>{ROLE_LABEL[me.role]}</Status>
      </p>
    </>
  );
}

function ThemeSwitch() {
  const { choice, setChoice } = useTheme();
  return <Segmented label="Theme" options={THEME_CHOICES} value={choice} onChange={setChoice} />;
}

function BadgeChip({ badge, active, floating }: { badge: Badge; active: boolean; floating?: boolean }) {
  const tone = badge.tone === "alert" ? "bg-crit-mark text-white" : badge.tone === "warn" ? "bg-warn-bg text-fg" : badge.tone === "done" ? "bg-pos-bg text-fg" : active ? "bg-white/20 text-on-signal" : "bg-sunken text-fg-2";
  return (
    <span className={cn("t-figure inline-flex h-[18px] items-center rounded-chip px-1.5 text-[11px]", tone, floating && "max-lg:absolute max-lg:right-0.5 max-lg:top-0 max-lg:h-4 max-lg:px-1 max-lg:text-[10px]")}>
      {badge.tone === "done" ? <Check className="size-3" aria-label={badge.text} /> : badge.text}
    </span>
  );
}

/** One row of the rail: an icon and a label from 1024px, the icon alone on tablets. */
function RailLink({ place, pathname, badge }: { place: Place; pathname: string; badge?: Badge }) {
  const active = isAt(place, pathname);
  return (
    <Link
      href={place.href}
      title={place.label}
      aria-current={active ? "page" : undefined}
      className={cn("group relative flex h-9 items-center gap-2.5 rounded-control px-2.5 text-[13.5px] transition-colors max-lg:justify-center", active ? "bg-signal font-medium text-on-signal" : "hover:bg-rail-2 hover:text-fg")}
    >
      <place.icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 truncate max-lg:sr-only">{place.label}</span>
      {badge && <BadgeChip badge={badge} active={active} floating />}
    </Link>
  );
}

/** The console frame. Everything inside it can ask what the signed-in person may do. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <AccessProvider>
      <Frame>{children}</Frame>
    </AccessProvider>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const { me, isAdmin } = useAccess();
  const pathname = usePathname();
  const router = useRouter();
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState<"attention" | "account" | "more" | null>(null);
  const [leaving, setLeaving] = useState(false);
  // Counts and the campaign list for navigation. If any of these fails, navigation still works; the pages report errors.
  const campaigns = useApi(backendUrl(["campaigns"]), campaignListSchema);
  const jobs = useApi(backendUrl(["jobs"], { limit: 1 }), jobsSchema);
  const requests = useApi(backendUrl(["requests"], { status: "new", limit: 1 }), websiteRequestListSchema);
  const status = useApi(backendUrl(["status"]), statusSchema);

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
  const waiting = requests.data?.new ?? 0;
  const paused = campaigns.data?.filter((c) => c.stop_reason) ?? [];
  const alerts = failed + paused.length;
  const recent = campaigns.data?.slice(0, 5) ?? [];
  const connected = status.data?.checks.filter((c) => c.ok).length;
  const places = PLACES.filter((place) => canSee(place, me, isAdmin));

  const badges: Record<string, Badge | undefined> = {
    "/dashboard/campaigns": campaigns.data ? { text: String(campaigns.data.length), tone: "plain" } : undefined,
    "/dashboard/requests": waiting > 0 ? { text: String(waiting), tone: "plain" } : undefined,
    "/dashboard/system": failed > 0 ? { text: String(failed), tone: "alert" } : undefined,
    "/dashboard/setup": status.data ? (status.data.ready_for_calls ? { text: "Connected", tone: "done" } : { text: `${connected}/${status.data.checks.length}`, tone: "warn" }) : undefined,
  };
  const group = (name: Place["group"]) => places.filter((place) => place.group === name);
  // Phones: three places within thumb reach, everything else one tap further under "More".
  const tabs = places.filter((place) => ["/dashboard", "/dashboard/campaigns", "/dashboard/requests"].includes(place.href));
  const more = places.filter((place) => !tabs.includes(place));
  const moreActive = more.some((place) => isAt(place, pathname)) || pathname.startsWith("/dashboard/account");

  return (
    <div className="app min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[95] focus:rounded-control focus:bg-signal focus:px-3 focus:py-2 focus:text-[13px] focus:font-medium focus:text-on-signal">
        Skip to the page
      </a>

      {/* Rail: labels from 1024px, icons only on tablets, replaced by the tab bar on phones. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col border-r border-line bg-rail text-rail-fg md:flex lg:w-56">
        <Link href="/dashboard" className="flex h-14 shrink-0 items-center gap-2.5 px-[18px] lg:px-4" aria-label="DevyTalk">
          <Mark />
          <span className="hidden text-[15px] font-semibold tracking-tight text-fg lg:block">DevyTalk</span>
        </Link>
        <nav aria-label="Primary" className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 pb-3 pt-2">
          <ul className="space-y-0.5">
            {group("main").map((place) => (
              <li key={place.href}>
                <RailLink place={place} pathname={pathname} badge={badges[place.href]} />
                {place.href === "/dashboard/campaigns" && recent.length > 0 && (
                  <ul className="mb-1.5 ml-[18px] mt-0.5 hidden space-y-px border-l border-line pl-2 lg:block" aria-label="Recent campaigns">
                    {recent.map((c) => {
                      const state = campaignTone(c);
                      const active = pathname === campaignHref(c.name) || pathname.startsWith(campaignHref(c.name) + "/");
                      return (
                        <li key={c.id}>
                          <Link href={campaignHref(c.name)} title={`${c.name} · ${state.text}`} className={cn("flex h-7 items-center gap-2 rounded-control px-2 text-[12.5px] transition-colors", active ? "bg-rail-2 font-medium text-fg" : "text-fg-2 hover:bg-rail-2 hover:text-fg")}>
                            <span className={cn("size-1.5 shrink-0 rounded-[1px]", state.live ? "animate-live bg-signal" : state.tone === "warn" ? "bg-warn-mark" : state.tone === "info" ? "bg-info-mark" : "bg-fg-3")} aria-hidden="true" />
                            <span className="truncate">{c.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          {(["account", "developers"] as const).map((name) =>
            group(name).length === 0 ? null : (
              <div key={name} className="mt-5 max-lg:mt-3 max-lg:border-t max-lg:border-line max-lg:pt-3">
                <p className="px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-3 max-lg:sr-only">{GROUP_TITLE[name]}</p>
                <ul className="space-y-0.5">
                  {group(name).map((place) => (
                    <li key={place.href}>
                      <RailLink place={place} pathname={pathname} badge={badges[place.href]} />
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
          <ul className="mt-auto space-y-0.5 border-t border-line pt-3">
            {group("foot").map((place) => (
              <li key={place.href} className="mt-0.5">
                <RailLink place={place} pathname={pathname} badge={badges[place.href]} />
              </li>
            ))}
          </ul>
        </nav>
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
                {initials(me) || <UserRound className="size-4" aria-hidden="true" />}
              </button>
              <Popover open={menu === "account"} onClose={() => setMenu(null)} label="Account" className="w-64">
                <div className="border-b border-line px-4 py-3" data-testid="identity">
                  <Identity me={me} />
                </div>
                <div className="border-b border-line px-4 py-3">
                  <p className="t-eyebrow mb-1.5">Theme</p>
                  <ThemeSwitch />
                </div>
                <div className="p-1.5">
                  {me?.kind === "user" && (
                    <Link href="/dashboard/account" className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-left text-[13.5px] text-fg-2 hover:bg-sunken hover:text-fg">
                      <KeyRound className="size-4" aria-hidden="true" /> Change password
                    </Link>
                  )}
                  <button type="button" onClick={signOut} disabled={leaving} className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-left text-[13.5px] text-fg-2 hover:bg-sunken hover:text-fg disabled:opacity-50">
                    <LogOut className="size-4" aria-hidden="true" /> Sign out
                  </button>
                </div>
              </Popover>
            </div>
          </div>
        </header>

        <main id="main" key={pathname} tabIndex={-1} className="mx-auto w-full max-w-[1480px] animate-rise px-4 pb-28 pt-5 outline-none sm:px-6 md:pb-12">
          {children}
        </main>
      </div>

      {/* Phones: three destinations as a tab bar within thumb reach, and "More" for the rest. */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur pb-safe md:hidden">
        <ul className="grid grid-cols-4">
          {tabs.map((place) => {
            const active = isAt(place, pathname) && menu !== "more";
            const badge = badges[place.href];
            return (
              <li key={place.href}>
                <Link href={place.href} aria-current={active ? "page" : undefined} className={cn("relative flex h-14 flex-col items-center justify-center gap-1 text-[10.5px] font-medium", active ? "text-fg" : "text-fg-3")}>
                  {active && <span className="absolute inset-x-6 top-0 h-[3px] rounded-b bg-signal" aria-hidden="true" />}
                  <span className="relative">
                    <place.icon className="size-5" aria-hidden="true" />
                    {place.href === "/dashboard/requests" && badge && <span className="absolute -right-1.5 -top-0.5 size-2 rounded-full bg-signal ring-2 ring-surface" aria-hidden="true" />}
                  </span>
                  {place.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setMenu(menu === "more" ? null : "more")} aria-expanded={menu === "more"} className={cn("relative flex h-14 w-full flex-col items-center justify-center gap-1 text-[10.5px] font-medium", menu === "more" || moreActive ? "text-fg" : "text-fg-3")}>
              {(menu === "more" || moreActive) && <span className="absolute inset-x-6 top-0 h-[3px] rounded-b bg-signal" aria-hidden="true" />}
              <span className="relative">
                <Ellipsis className="size-5" aria-hidden="true" />
                {failed > 0 && <span className="absolute -right-1.5 -top-0.5 size-2 rounded-full bg-crit-mark ring-2 ring-surface" aria-hidden="true" />}
              </span>
              More
            </button>
          </li>
        </ul>
        {menu === "more" && (
          <>
            <div className="fixed inset-0 -z-10 animate-fade bg-scrim" onClick={() => setMenu(null)} aria-hidden="true" />
            <div role="dialog" aria-label="More" className="absolute inset-x-0 bottom-full max-h-[78dvh] animate-sheet-up overflow-y-auto overscroll-contain rounded-t-overlay border-t border-line bg-surface p-4 shadow-overlay">
              <div className="mx-auto -mt-1.5 mb-3 h-1 w-9 rounded-full bg-line-strong" aria-hidden="true" />
              <ul className="grid grid-cols-2 gap-2">
                {more.map((place) => {
                  const active = isAt(place, pathname);
                  const badge = badges[place.href];
                  return (
                    <li key={place.href}>
                      <Link href={place.href} aria-current={active ? "page" : undefined} className={cn("flex h-full items-start gap-2.5 rounded-control border px-3 py-2.5", active ? "border-signal bg-pos-bg" : "border-line active:bg-sunken")}>
                        <place.icon className="mt-0.5 size-4 shrink-0 text-fg-2" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2 text-[13.5px] font-medium text-fg">
                            {place.label}
                            {badge && <BadgeChip badge={badge} active={false} />}
                          </span>
                          <span className="t-meta mt-0.5 line-clamp-2">{place.about}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 border-t border-line pt-4">
                <Identity me={me} />
              </div>
              <div className="mt-4">
                <p className="t-eyebrow mb-1.5">Theme</p>
                <ThemeSwitch />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {me?.kind === "user" && (
                  <Link href="/dashboard/account" className="flex h-11 items-center justify-center gap-2 rounded-control border border-line-strong text-[14px] font-medium text-fg">
                    <KeyRound className="size-4" aria-hidden="true" /> Password
                  </Link>
                )}
                <button type="button" onClick={signOut} disabled={leaving} className={cn("flex h-11 items-center justify-center gap-2 rounded-control border border-line-strong text-[14px] font-medium text-fg", me?.kind !== "user" && "col-span-2")}>
                  <LogOut className="size-4" aria-hidden="true" /> Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </nav>

      {palette && <CommandPalette campaigns={campaigns.data ?? []} places={places} canCreate={isAdmin} onClose={() => setPalette(false)} />}
    </div>
  );
}
