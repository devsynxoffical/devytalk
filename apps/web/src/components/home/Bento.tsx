import Link from "next/link";
import { ArrowUpRight, BarChart3, Globe2, MessageSquareText, Mic, Play, PlugZap } from "lucide-react";
import { integrations } from "@/content/integrations";
import { AppIcon } from "@/components/brand/AppIcon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

function Card({ href, icon, title, body, children, className }: { href: string; icon: ReactNode; title: string; body: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("group shadow-card flex flex-col overflow-hidden rounded-[1.5rem] border border-ink-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-brand-200", className)}
    >
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-brand-50 via-white to-sky-300/15 sm:h-52">{children}</div>
      <div className="flex flex-1 flex-col p-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-700 [&_svg]:size-4">
          {icon}
          {title}
          <ArrowUpRight className="ml-auto size-4 text-ink-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden="true" />
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{body}</p>
      </div>
    </Link>
  );
}

const numbers = [
  ["🇺🇸", "+1 (415) 555 0134", "Local"],
  ["🇬🇧", "+44 800 046 1234", "Toll-free"],
  ["🇩🇪", "+49 30 1234 5678", "Local"],
  ["🇦🇪", "+971 800 0321", "Toll-free"],
  ["🇵🇰", "+92 42 3512 3456", "Local"],
  ["🇦🇺", "+61 2 9876 5432", "Local"],
];

export function Bento() {
  const apps = integrations.filter((i) => i.icon).slice(0, 9);
  return (
    <section className="container-page py-16 sm:py-24">
      <SectionHeading eyebrow="Platform" title="One workspace for every conversation" description="Numbers, recordings, analytics, messaging and your favourite apps, all connected out of the box." />
      <div className="mt-14 grid grid-cols-1 [&>*]:min-w-0 gap-5 lg:grid-cols-3">
        <Card href="/numbers" icon={<Globe2 />} title="Global numbers" body="Local, mobile and toll-free numbers in 140+ countries. Live in seconds, ported for free." className="lg:col-span-2">
          <div className="mask-fade-x absolute inset-0 flex flex-col justify-center gap-3 py-6">
            {[0, 1].map((row) => (
              <div key={row} className={cn("flex w-max gap-3", row === 1 && "ml-[-7rem]")}>
                {[...numbers, ...numbers].slice(row * 2, row * 2 + 7).map(([f, n, t], k) => (
                  <span key={k} className="flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 py-2.5 text-sm shadow-sm">
                    <span aria-hidden="true">{f}</span>
                    <span className="font-semibold text-ink-900">{n}</span>
                    <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">{t}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </Card>
        <Card href="/features/call-recording" icon={<Mic />} title="Call recording" body="Every call recorded, transcribed and searchable, with pause for payments.">
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-2xl border border-ink-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-brand-600 text-white">
                <Play className="size-4 fill-current" aria-hidden="true" />
              </span>
              <div className="flex h-9 flex-1 items-center gap-[2px]" aria-hidden="true">
                {Array.from({ length: 40 }, (_, k) => (
                  <span key={k} className={cn("w-1 rounded-full", k < 16 ? "bg-brand-500" : "bg-ink-200")} style={{ height: `${25 + Math.abs(Math.sin(k * 0.9)) * 75}%` }} />
                ))}
              </div>
            </div>
            <p className="mt-2 flex justify-between font-mono text-[10px] text-ink-400">
              <span>01:48</span>
              <span>04:36</span>
            </p>
          </div>
        </Card>
        <Card href="/features/analytics" icon={<BarChart3 />} title="Analytics" body="Live wallboards and 30+ reports on queues, agents and outcomes.">
          <div className="absolute inset-x-6 bottom-0 top-8 flex items-end gap-2" aria-hidden="true">
            {[40, 62, 48, 80, 56, 92, 70].map((h, k) => (
              <span key={k} className={cn("flex-1 rounded-t-lg", k === 5 ? "bg-brand-600" : "bg-brand-200")} style={{ height: `${h}%` }} />
            ))}
          </div>
          <span className="absolute right-6 top-6 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-brand-700 shadow-sm">+24% answered</span>
        </Card>
        <Card href="/features/sms-whatsapp" icon={<MessageSquareText />} title="SMS & WhatsApp" body="Text from your business numbers, in the same thread as your calls.">
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 space-y-2 text-sm">
            <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-ink-700 shadow-sm">Sorry I missed your call! Is now good?</p>
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3 py-2 text-white">Yes, calling you in 2 min 👍</p>
            <p className="w-fit rounded-full bg-[#25d366]/15 px-2 py-0.5 text-[10px] font-semibold text-[#128c4b]">via WhatsApp</p>
          </div>
        </Card>
        <Card href="/integrations" icon={<PlugZap />} title="100+ integrations" body="Calls and summaries sync to your CRM and helpdesk automatically.">
          <div className="absolute inset-0 grid place-items-center">
            <div className="grid grid-cols-3 gap-3">
              {apps.map((a) => (
                <AppIcon key={a.name} icon={a.icon} name={a.name} color={a.color} size="sm" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
