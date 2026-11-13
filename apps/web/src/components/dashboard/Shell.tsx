"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Activity, BarChart3, Bell, FlaskConical, LayoutDashboard, LogOut, Megaphone, Menu, Search, Sparkles, Users, X, type LucideIcon } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { backendUrl, useApi } from "@/lib/api/client";
import { campaignListSchema, jobsSchema } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean; badge?: ReactNode; alert?: boolean };

function NavLink({ item, pathname, onNavigate }: { item: Item; pathname: string; onNavigate: () => void }) {
  const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-white text-ink-900 shadow-sm ring-1 ring-ink-100" : "text-ink-600 hover:bg-white/70 hover:text-ink-900",
      )}
    >
      {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-brand-600" aria-hidden="true" />}
      <item.icon className={cn("size-4", active ? "text-brand-700" : "text-ink-400")} aria-hidden="true" />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge !== null && (
        <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums", item.alert ? "bg-red-50 text-red-700" : "bg-ink-100 text-ink-600")}>{item.badge}</span>
      )}
    </Link>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Counts for the sidebar. If either cannot be loaded the badge is simply left out; the pages themselves report errors.
  const campaigns = useApi(backendUrl(["campaigns"]), campaignListSchema);
  const jobs = useApi(backendUrl(["jobs"], { limit: 1 }), jobsSchema);

  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    // Ctrl or Command + K jumps to the search field from anywhere in the dashboard.
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
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

  function search(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/dashboard/campaigns?q=${encodeURIComponent(q)}` : "/dashboard/campaigns");
  }

  const failed = jobs.data?.stats.dead ?? 0;
  const paused = campaigns.data?.filter((c) => c.stop_reason).length ?? 0;
  const alerts = failed + paused;
  // Inside a campaign, its sections are one click away in the sidebar as well.
  const inCampaign = pathname.match(/^\/dashboard\/campaigns\/([^/]+)/);
  const campaignBase = inCampaign ? `/dashboard/campaigns/${inCampaign[1]}` : null;
  const campaignName = inCampaign ? decodeURIComponent(inCampaign[1]) : "";
  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Main",
      items: [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
        { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone, exact: Boolean(campaignBase), badge: campaigns.data ? campaigns.data.length : undefined },
      ],
    },
    ...(campaignBase
      ? [
          {
            title: campaignName,
            items: [
              { href: campaignBase, label: "Performance", icon: BarChart3, exact: true },
              { href: `${campaignBase}/leads`, label: "Leads", icon: Users },
              { href: `${campaignBase}/playbook`, label: "Coach & playbook", icon: Sparkles },
              { href: `${campaignBase}/experiments`, label: "A/B tests", icon: FlaskConical },
            ],
          },
        ]
      : []),
    {
      title: "System",
      items: [{ href: "/dashboard/system", label: "Background work", icon: Activity, badge: failed > 0 ? `${failed} failed` : undefined, alert: failed > 0 }],
    },
  ];

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-1" aria-label="DevyTalk dashboard">
        <LogoMark />
        <span className="leading-tight">
          <span className="block text-[15px] font-bold tracking-tight text-ink-900">
            devy<span className="text-brand-600">talk</span>
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-ink-400">Sales calls</span>
        </span>
      </Link>
      <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-5">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 truncate px-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} onNavigate={() => setMenuOpen(false)} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <button
        type="button"
        onClick={signOut}
        disabled={leaving}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-600 hover:bg-white/70 hover:text-ink-900 disabled:opacity-50"
      >
        <LogOut className="size-4 text-ink-400" aria-hidden="true" /> Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh bg-ink-100 text-ink-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">{sidebar}</aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/30" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <aside className="relative h-full w-64 bg-ink-100 shadow-2xl">
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 rounded-lg p-1.5 text-ink-500 hover:bg-white">
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <div className="min-h-dvh bg-ink-50 lg:my-3 lg:mr-3 lg:min-h-[calc(100dvh-1.5rem)] lg:rounded-3xl lg:border lg:border-white lg:shadow-sm">
          <header className="flex items-center gap-3 px-4 pt-4 sm:px-6 lg:px-7 lg:pt-5">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-ink-600 hover:bg-white lg:hidden">
              <Menu className="size-5" />
            </button>
            <form onSubmit={search} role="search" className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
              <input
                ref={searchInput}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search campaigns"
                placeholder="Search campaigns…"
                className="h-10 w-full rounded-xl border border-ink-100 bg-white pl-9 pr-12 text-sm placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md bg-ink-50 px-1.5 py-0.5 text-[10px] font-semibold text-ink-500 ring-1 ring-ink-100 sm:block" aria-hidden="true">
                ⌘K
              </kbd>
            </form>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/dashboard"
                aria-label={alerts > 0 ? `${alerts} ${alerts === 1 ? "item needs" : "items need"} your attention` : "Nothing needs your attention"}
                className="relative grid size-10 place-items-center rounded-xl bg-white text-ink-600 ring-1 ring-ink-100 hover:text-ink-900"
              >
                <Bell className="size-[18px]" aria-hidden="true" />
                {alerts > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" aria-hidden="true" />}
              </Link>
              <div className="flex items-center gap-2.5 rounded-xl bg-white py-1.5 pl-1.5 pr-3 ring-1 ring-ink-100">
                <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white" aria-hidden="true">
                  OP
                </span>
                <span className="hidden leading-tight sm:block">
                  <span className="block text-sm font-semibold text-ink-900">Operator</span>
                  <span className="block text-[11px] text-ink-500">Signed in with access token</span>
                </span>
              </div>
            </div>
          </header>
          <main id="main" className="px-4 pb-10 pt-6 sm:px-6 lg:px-7">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
