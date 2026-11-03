import type { ReactNode } from "react";
import {
  Bot,
  CalendarCheck,
  Check,
  ChevronDown,
  Clock,
  Ear,
  Globe2,
  Hash,
  Headphones,
  Languages,
  Mic,
  MessageSquare,
  Phone,
  PhoneIncoming,
  Play,
  Sparkles,
  Star,
  UserRound,
  Users,
  Voicemail,
} from "lucide-react";
import { cn } from "@/lib/cn";

/** Static product UI illustrations rendered in HTML so they stay crisp and themeable. */
function Window({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("shadow-float absolute inset-x-0 top-0 overflow-hidden rounded-t-2xl border border-ink-100 bg-white", className)}>
      <div className="flex h-10 items-center gap-2 border-b border-ink-100 px-4">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="ml-3 text-xs font-medium text-ink-500">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Node({ icon, label, sub, tone = "white" }: { icon: ReactNode; label: string; sub?: string; tone?: "white" | "dark" | "ai" }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs shadow-sm",
        tone === "dark" && "border-ink-900 bg-ink-900 text-white",
        tone === "white" && "border-ink-100 bg-white text-ink-800",
        tone === "ai" && "border-lime-400 bg-lime-300/40 text-ink-900",
      )}
    >
      <span className="[&_svg]:size-3.5">{icon}</span>
      <span>
        <span className="block font-semibold">{label}</span>
        {sub && <span className={cn("block text-[10px]", tone === "dark" ? "text-white/60" : "text-ink-500")}>{sub}</span>}
      </span>
    </div>
  );
}

const Connector = () => <span className="mx-auto block h-5 w-px bg-ink-200" aria-hidden="true" />;

function Side({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="hidden w-64 shrink-0 border-l border-ink-100 bg-white p-4 md:block">
      <p className="text-sm font-semibold text-ink-900">{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({ icon, title, sub, active }: { icon: ReactNode; title: string; sub: string; active?: boolean }) {
  return (
    <div className={cn("flex gap-2.5 rounded-xl border p-2.5", active ? "border-brand-300 bg-brand-50" : "border-ink-100")}>
      <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-md [&_svg]:size-3.5", active ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-500")}>{icon}</span>
      <span>
        <span className="block text-xs font-semibold text-ink-900">{title}</span>
        <span className="block text-[10px] leading-snug text-ink-500">{sub}</span>
      </span>
    </div>
  );
}

export function RoutingMockup() {
  return (
    <Window title="Call flow · Main line">
      <div className="flex h-[24rem]">
        <div className="bg-dots flex flex-1 flex-col items-center justify-start gap-0 py-6">
          <Node tone="dark" icon={<PhoneIncoming />} label="Incoming call" sub="+49 30 1234 5678" />
          <Connector />
          <Node icon={<Clock />} label="Business hours" sub="Mon–Fri · 08:00–18:00" />
          <Connector />
          <Node icon={<Hash />} label="Menu" sub="1 Sales · 2 Support · 3 Billing" />
          <div className="relative mt-5 flex gap-4">
            <span className="absolute -top-5 left-1/4 right-1/4 h-5 border-x border-t border-ink-200" aria-hidden="true" />
            <Node icon={<Languages />} label="Skill: German" sub="Sales DACH" />
            <Node icon={<Star />} label="VIP" sub="Priority queue" />
          </div>
          <Connector />
          <Node tone="ai" icon={<Bot />} label="No answer in 20s" sub="AI agent takes over" />
        </div>
        <Side title="Routing rules">
          <Row active icon={<Users />} title="Skill-based routing" sub="Match language and product skills" />
          <Row icon={<UserRound />} title="Sticky agent" sub="Returning callers reach their last rep" />
          <Row icon={<Star />} title="VIP priority" sub="From HubSpot lifecycle stage" />
          <Row icon={<Voicemail />} title="Overflow" sub="AI agent, then voicemail" />
        </Side>
      </div>
    </Window>
  );
}

export function DialerMockup() {
  const rows = [
    { n: "Emma Fischer", c: "Northwind", s: "Connected", t: "brand" },
    { n: "Liam O'Brien", c: "Fernway", s: "Voicemail dropped", t: "ink" },
    { n: "Sara Nakamura", c: "Helio", s: "Next up", t: "lime" },
    { n: "Diego Alvarez", c: "Paperhaus", s: "Queued", t: "ink" },
    { n: "Priya Raman", c: "Orbitly", s: "Queued", t: "ink" },
  ];
  return (
    <Window title="Power Dialer · Q4 outbound">
      <div className="flex h-[24rem]">
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">Campaign · 248 contacts</p>
            <span className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">Dialing…</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
            <div className="h-full w-[38%] rounded-full bg-brand-500" />
          </div>
          <ul className="mt-4 divide-y divide-ink-100 rounded-xl border border-ink-100">
            {rows.map((r) => (
              <li key={r.n} className="flex items-center gap-3 px-3 py-2.5 text-xs">
                <span className="grid size-7 place-items-center rounded-full bg-ink-50 font-semibold text-ink-600">{r.n[0]}</span>
                <span className="flex-1">
                  <span className="block font-semibold text-ink-900">{r.n}</span>
                  <span className="text-ink-500">{r.c}</span>
                </span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 font-semibold",
                    r.t === "brand" && "bg-brand-100 text-brand-800",
                    r.t === "lime" && "bg-lime-300/50 text-ink-800",
                    r.t === "ink" && "bg-ink-50 text-ink-500",
                  )}
                >
                  {r.s}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Side title="On call · Emma Fischer">
          <div className="rounded-xl bg-ink-900 p-3 text-white">
            <p className="text-[10px] text-white/60">Northwind · Head of Ops</p>
            <p className="mt-1 font-mono text-lg">03:42</p>
            <div className="mt-2 flex gap-1.5">
              {[Mic, Phone, Users].map((I, k) => (
                <span key={k} className={cn("grid size-7 place-items-center rounded-full", k === 1 ? "bg-red-500" : "bg-white/10")}>
                  <I className="size-3.5" aria-hidden="true" />
                </span>
              ))}
            </div>
          </div>
          <Row icon={<MessageSquare />} title="Notes" sub="Interested in 30 seats, wants SSO" />
          <Row active icon={<CalendarCheck />} title="Outcome" sub="Meeting booked · syncs to HubSpot" />
        </Side>
      </div>
    </Window>
  );
}

export function SupervisorMockup() {
  const calls = [
    { a: "Lena", q: "Sales DACH", d: "04:12", s: "positive" },
    { a: "James", q: "Support UK", d: "11:48", s: "negative" },
    { a: "Ayesha", q: "Support PK", d: "02:05", s: "neutral" },
  ];
  return (
    <Window title="Live monitor">
      <div className="h-[24rem] p-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            ["Calls waiting", "3"],
            ["Longest wait", "0:42"],
            ["Agents free", "12"],
            ["Service level", "94%"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-ink-100 p-3">
              <p className="text-[10px] text-ink-500">{k}</p>
              <p className="mt-1 text-lg font-semibold text-ink-900">{v}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 space-y-2">
          {calls.map((c) => (
            <li key={c.a} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 text-xs">
              <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-sky-300 to-brand-600 font-semibold text-white">{c.a[0]}</span>
              <span className="w-24">
                <span className="block font-semibold text-ink-900">{c.a}</span>
                <span className="text-ink-500">{c.q}</span>
              </span>
              <span className="font-mono text-ink-600">{c.d}</span>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 font-semibold",
                  c.s === "positive" && "bg-brand-100 text-brand-800",
                  c.s === "negative" && "bg-red-100 text-red-700",
                  c.s === "neutral" && "bg-ink-50 text-ink-600",
                )}
              >
                {c.s}
              </span>
              <span className="ml-auto hidden gap-1.5 sm:flex">
                {[
                  [Ear, "Listen"],
                  [MessageSquare, "Whisper"],
                  [Headphones, "Barge"],
                ].map(([I, l]) => {
                  const Icon = I as typeof Ear;
                  return (
                    <span key={l as string} className={cn("inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-semibold", c.s === "negative" && l === "Whisper" ? "border-brand-600 bg-brand-600 text-white" : "border-ink-200 text-ink-700")}>
                      <Icon className="size-3" aria-hidden="true" /> {l as string}
                    </span>
                  );
                })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Window>
  );
}

export function AgentBuilderMockup() {
  return (
    <Window title="AI agents · Front desk">
      <div className="flex h-[24rem]">
        <div className="bg-dots flex flex-1 flex-col items-center py-6">
          <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-semibold text-brand-800">● Published</span>
          <Connector />
          <Node tone="dark" icon={<PhoneIncoming />} label="Support line" sub="Queue · 24/7" />
          <Connector />
          <Node tone="ai" icon={<Bot />} label="Devy · Front desk" sub="Answers, books, routes" />
          <div className="relative mt-5 flex gap-4">
            <span className="absolute -top-5 left-1/4 right-1/4 h-5 border-x border-t border-ink-200" aria-hidden="true" />
            <Node icon={<Check />} label="Resolved" sub="68% of calls" />
            <Node icon={<Users />} label="Transfer" sub="With summary" />
          </div>
        </div>
        <Side title="Agent settings">
          <div className="rounded-xl border border-ink-100 p-2.5">
            <p className="text-[10px] text-ink-500">Voice</p>
            <p className="mt-0.5 flex items-center justify-between text-xs font-semibold text-ink-900">
              Aria · warm, natural <ChevronDown className="size-3.5" aria-hidden="true" />
            </p>
          </div>
          <div className="rounded-xl border border-ink-100 p-2.5">
            <p className="text-[10px] text-ink-500">Languages</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {["EN", "DE", "ES", "AR", "UR", "+25"].map((l) => (
                <span key={l} className="rounded bg-ink-50 px-1.5 py-0.5 text-[10px] font-semibold text-ink-700">{l}</span>
              ))}
            </div>
          </div>
          <Row active icon={<Globe2 />} title="Knowledge" sub="help.yourcompany.com · 214 articles" />
          <Row icon={<CalendarCheck />} title="Can book meetings" sub="Google Calendar connected" />
          <span className="block rounded-lg bg-brand-600 py-2 text-center text-xs font-semibold text-white">Save</span>
        </Side>
      </div>
    </Window>
  );
}

export function FollowUpMockup() {
  const steps = [
    { t: "14:15:02", icon: <Globe2 />, title: "Demo form submitted", sub: "Priya Raman · Orbitly · 25 seats" },
    { t: "14:15:41", icon: <Phone />, title: "Devy calls back", sub: "39 seconds after the form" },
    { t: "14:17:10", icon: <Sparkles />, title: "Qualified", sub: "Budget ✓ · Timeline Q1 ✓ · Decision maker ✓" },
    { t: "14:17:55", icon: <CalendarCheck />, title: "Meeting booked", sub: "Thu 11:00 with Marcus · added to HubSpot" },
  ];
  return (
    <Window title="Speed-to-lead · Website demo requests">
      <div className="h-[24rem] p-6">
        <ol className="relative ml-3 space-y-5 border-l border-dashed border-ink-200 pl-7">
          {steps.map((s, i) => (
            <li key={s.title} className="relative">
              <span
                className={cn(
                  "absolute -left-[2.55rem] grid size-7 place-items-center rounded-full border-2 border-white [&_svg]:size-3.5",
                  i === steps.length - 1 ? "bg-brand-600 text-white" : "bg-lime-300 text-ink-900",
                )}
              >
                {s.icon}
              </span>
              <div className="flex items-start justify-between gap-4 rounded-xl border border-ink-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{s.title}</p>
                  <p className="text-xs text-ink-500">{s.sub}</p>
                </div>
                <span className="font-mono text-[11px] text-ink-400">{s.t}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Window>
  );
}

export function ScorecardMockup() {
  const crit = [
    ["Greeting & intro", 95],
    ["Discovery questions", 82],
    ["Objection handling", 64],
    ["Clear next step", 90],
  ] as const;
  return (
    <Window title="Call review · Lena → Northwind">
      <div className="grid grid-cols-1 [&>*]:min-w-0 h-[24rem] gap-4 p-5 md:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-sky-300/20 p-4">
          <div className="relative size-32">
            <svg viewBox="0 0 36 36" className="size-full -rotate-90" aria-hidden="true">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#dfe4ec" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#078a6c" strokeWidth="3" strokeDasharray="84 100" strokeLinecap="round" pathLength="100" />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-3xl font-semibold text-ink-900">84</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-ink-900">Call score</p>
          <p className="text-xs text-ink-500">+9 vs. team average</p>
        </div>
        <div className="space-y-3">
          {crit.map(([k, v]) => (
            <div key={k}>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-ink-700">{k}</span>
                <span className="font-mono text-ink-500">{v}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
                <div className={cn("h-full rounded-full", v < 70 ? "bg-amber-400" : "bg-brand-500")} style={{ width: `${v}%` }} />
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-lime-400 bg-lime-300/30 p-3 text-xs text-ink-800">
            <p className="flex items-center gap-1 font-semibold">
              <Sparkles className="size-3.5" aria-hidden="true" /> Coaching tip
            </p>
            <p className="mt-1">Pricing objection at 06:12 — try anchoring on ROI before discounting.</p>
            <p className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-700">
              <Play className="size-3" aria-hidden="true" /> Jump to moment
            </p>
          </div>
        </div>
      </div>
    </Window>
  );
}
