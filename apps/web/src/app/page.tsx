import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Globe2, PlugZap, ShieldCheck, Sparkles, UserPlus, Users } from "lucide-react";
import { features } from "@/content/features";
import { integrations } from "@/content/integrations";
import { homeFaq } from "@/content/faq";
import { solutions } from "@/content/solutions";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FaqList } from "@/components/ui/FaqList";
import { FeatureCard } from "@/components/sections/FeatureCard";
import { LogoCloud } from "@/components/sections/LogoCloud";
import { Testimonials } from "@/components/sections/Testimonials";
import { CtaBand } from "@/components/sections/CtaBand";
import { Softphone } from "@/components/interactive/Softphone";
import { RoiCalculator } from "@/components/interactive/RoiCalculator";

const stats = [
  { value: "4,000+", label: "teams calling every day" },
  { value: "140+", label: "countries with local numbers" },
  { value: "99.99%", label: "platform uptime" },
  { value: "4.8/5", label: "average customer rating" },
];

const steps = [
  { icon: UserPlus, title: "Create your workspace", body: "Sign up, invite your team and choose numbers in the countries you need." },
  { icon: PlugZap, title: "Connect your tools", body: "Link your CRM or helpdesk in one click so every call is logged automatically." },
  { icon: Users, title: "Start calling", body: "Agents call from the browser, desktop or mobile app. Managers watch it live." },
];

const aiPoints = [
  "Transcripts and summaries written to your CRM after every call",
  "An AI Voice Agent that answers and books meetings around the clock",
  "Automatic scorecards that show reps exactly where to improve",
  "Keyword alerts for competitor mentions, churn risk and upsell signals",
];

export default function HomePage() {
  const highlighted = features.filter((f) =>
    ["power-dialer", "smart-routing", "ivr", "call-recording", "analytics", "global-numbers"].includes(f.slug),
  );
  const popular = integrations.filter((i) => i.popular).slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900 pb-20 pt-32 text-white sm:pt-40">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" aria-hidden="true" />
        <div className="absolute -left-40 top-20 size-[32rem] rounded-full bg-brand-500/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-20 bottom-0 size-96 rounded-full bg-accent-400/10 blur-3xl" aria-hidden="true" />
        <div className="container-page relative grid items-center gap-16 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <Link
              href="/features/ai-voice-agent"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-1 pr-4 text-sm text-ink-200 transition-colors hover:border-brand-400"
            >
              <span className="rounded-full bg-accent-400 px-2.5 py-0.5 text-xs font-bold text-ink-900">New</span>
              Meet the AI Voice Agent
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Every call, <span className="text-gradient">smarter.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-300 text-pretty sm:text-xl">
              The cloud phone system and AI call center for sales and support teams. Dial faster, route smarter and learn from every conversation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/signup" variant="accent" size="lg">
                Start free trial
              </ButtonLink>
              <ButtonLink href="/demo" variant="light" size="lg">
                Book a demo
              </ButtonLink>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-300">
              {["14-day free trial", "No credit card", "Cancel anytime"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-brand-400" aria-hidden="true" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Softphone />
            <p className="mt-6 text-center text-xs text-ink-400">Try it: dial a number and press call.</p>
          </div>
        </div>
        <div className="container-page relative mt-20">
          <LogoCloud inverted />
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-ink-200 bg-white">
        <dl className="container-page grid grid-cols-2 gap-8 py-12 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd className="text-3xl font-extrabold text-ink-900 sm:text-4xl">{s.value}</dd>
              <dd className="mt-1 text-sm text-ink-500">{s.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Features */}
      <section className="container-page py-24">
        <SectionHeading
          eyebrow="Platform"
          title="One platform for every customer conversation"
          description="Everything your team needs to make, take and learn from calls, without stitching tools together."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {highlighted.map((f) => (
            <FeatureCard key={f.slug} feature={f} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink href="/features" variant="outline">
            Explore all features <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>

      {/* Solutions */}
      <section className="bg-white py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Solutions" title="Built for the way your team works" />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {solutions.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.slug}
                  href={`/solutions/${s.slug}`}
                  className="group flex items-start gap-4 rounded-2xl border border-ink-200 p-6 transition-colors hover:border-brand-400 hover:bg-brand-50/50"
                >
                  <Icon className="mt-0.5 size-6 shrink-0 text-brand-600" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-ink-900">{s.name}</p>
                    <p className="mt-1 text-sm text-ink-500">{s.short}</p>
                  </div>
                  <ArrowRight className="ml-auto mt-1 size-4 shrink-0 text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-600" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI */}
      <section className="relative overflow-hidden bg-ink-900 py-24 text-white">
        <div className="absolute right-0 top-0 size-[40rem] rounded-full bg-brand-500/10 blur-3xl" aria-hidden="true" />
        <div className="container-page relative grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              inverted
              eyebrow="DevyTalk AI"
              title="AI that listens, learns and lightens the load"
              description="Built into every call, not bolted on. Your team gets the context and coaching, without the busywork."
            />
            <ul className="mt-8 space-y-4">
              {aiPoints.map((p) => (
                <li key={p} className="flex gap-3 text-ink-200">
                  <Sparkles className="mt-0.5 size-5 shrink-0 text-accent-400" aria-hidden="true" /> {p}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/features/conversation-intelligence" variant="accent">
                Conversation Intelligence
              </ButtonLink>
              <ButtonLink href="/features/ai-voice-agent" variant="light">
                AI Voice Agent
              </ButtonLink>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Call summary</p>
              <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-semibold text-brand-200">Synced to CRM</span>
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                ["Sentiment", "Positive"],
                ["Talk ratio", "42 / 58"],
                ["Score", "92"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-ink-800 p-4">
                  <dt className="text-xs text-ink-400">{k}</dt>
                  <dd className="mt-1 text-lg font-bold">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 space-y-3 text-sm">
              <p className="text-ink-300">
                <span className="font-semibold text-white">Summary: </span>
                Prospect runs a 12-person support team, evaluating tools before Q1. Main concern is Zendesk integration and EU data residency.
              </p>
              <p className="text-ink-300">
                <span className="font-semibold text-white">Next steps: </span>
                Send security docs · Book technical demo for Thursday
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {["pricing", "zendesk", "data residency", "Q1 rollout"].map((t) => (
                <span key={t} className="rounded-full bg-white/10 px-3 py-1 text-xs text-ink-200">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-24">
        <SectionHeading eyebrow="Get started" title="Live in minutes, not months" />
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="relative rounded-3xl border border-ink-200 bg-white p-8">
                <span className="absolute right-6 top-6 text-5xl font-extrabold text-ink-100" aria-hidden="true">
                  {i + 1}
                </span>
                <Icon className="size-8 text-brand-600" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-ink-500">{s.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ROI */}
      <section className="bg-ink-900 py-24 text-white">
        <div className="container-page">
          <SectionHeading
            inverted
            eyebrow="Calculator"
            title="How much time could your team win back?"
            description="Move the sliders to estimate the impact of replacing manual dialing with the Power Dialer."
          />
          <div className="mt-14">
            <RoiCalculator />
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="container-page grid items-center gap-14 py-24 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Integrations"
            title="Works with the tools you already use"
            description="Every call, recording and note flows into your CRM and helpdesk automatically. No copy-paste."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/integrations">Browse integrations</ButtonLink>
          </div>
        </div>
        <ul className="grid grid-cols-3 gap-4">
          {popular.map((i) => (
            <li key={i.name} className="flex flex-col items-center gap-3 rounded-2xl border border-ink-200 bg-white p-5 text-center">
              <span className="grid size-12 place-items-center rounded-xl text-sm font-extrabold text-white" style={{ backgroundColor: i.color }} aria-hidden="true">
                {i.name.slice(0, 2)}
              </span>
              <span className="text-sm font-semibold">{i.name}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Trust */}
      <section className="bg-white py-20">
        <div className="container-page grid gap-6 md:grid-cols-3">
          {[
            { icon: Globe2, title: "Global by default", body: "Numbers in 140+ countries and data centers on three continents for crystal-clear audio.", href: "/numbers" },
            { icon: ShieldCheck, title: "Secure & compliant", body: "Encryption in transit and at rest, GDPR-ready, SSO and granular roles.", href: "/legal/privacy" },
            { icon: Clock, title: "Support that answers", body: "Real people on chat, email and phone, with a median first response under 5 minutes.", href: "/demo" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.title} href={c.href} className="group rounded-3xl bg-ink-50 p-8 transition-colors hover:bg-brand-50">
                <Icon className="size-8 text-brand-600" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-bold">{c.title}</h3>
                <p className="mt-2 text-ink-500">{c.body}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <Testimonials />

      <section className="container-page pb-8">
        <SectionHeading title="Questions, answered" />
        <div className="mt-10">
          <FaqList items={homeFaq} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
