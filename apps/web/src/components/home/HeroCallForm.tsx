"use client";

import { useState, type FormEvent } from "react";
import { Loader2, PhoneCall, ShieldCheck } from "lucide-react";
import { useLeadSubmit } from "@/components/interactive/useLeadSubmit";

const CODES = [
  { code: "+1", flag: "🇺🇸", label: "United States" },
  { code: "+44", flag: "🇬🇧", label: "United Kingdom" },
  { code: "+49", flag: "🇩🇪", label: "Germany" },
  { code: "+33", flag: "🇫🇷", label: "France" },
  { code: "+34", flag: "🇪🇸", label: "Spain" },
  { code: "+971", flag: "🇦🇪", label: "UAE" },
  { code: "+92", flag: "🇵🇰", label: "Pakistan" },
  { code: "+91", flag: "🇮🇳", label: "India" },
  { code: "+61", flag: "🇦🇺", label: "Australia" },
];

/** "Get a call from our AI agent" card in the hero. Stores a callback request through /api/leads. */
export function HeroCallForm() {
  const [code, setCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const { status, error, fields, submit } = useLeadSubmit();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await submit({ kind: "callback", phone: `${code} ${phone}`.trim(), email });
  }

  return (
    <div className="shadow-float w-full rounded-[1.5rem] border border-ink-100 bg-white p-5 text-ink-900 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-lime-300 via-brand-400 to-sky-400">
          <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-brand-400/40" aria-hidden="true" />
          <span className="relative size-5 rounded-full bg-white/90 shadow-inner" />
        </span>
        <div>
          <p className="font-semibold">Meet Devy, our AI agent</p>
          <p className="text-xs text-ink-500">Hear how it qualifies a lead in under two minutes.</p>
        </div>
      </div>

      {status === "success" ? (
        <div className="mt-6 rounded-2xl bg-brand-50 p-5 text-center" role="status">
          <div className="mx-auto flex h-8 items-end justify-center gap-1" aria-hidden="true">
            {[10, 22, 14, 28, 18, 24, 12].map((h, i) => (
              <span key={i} className="w-1.5 animate-pulse rounded-full bg-brand-500" style={{ height: h, animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
          <p className="mt-3 font-semibold text-brand-800">Request received</p>
          <p className="mt-1 text-sm text-brand-700">
            Devy will call {code} {phone} shortly. Keep your phone nearby.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-5 space-y-3">
          <p className="text-[13px] font-medium text-ink-600">Enter your number and Devy will call you</p>
          <div className="flex gap-2">
            <label htmlFor="hero-code" className="sr-only">Country code</label>
            <select
              id="hero-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-12 rounded-xl border border-ink-200 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
            >
              {CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
            <label htmlFor="hero-phone" className="sr-only">Phone number</label>
            <input
              id="hero-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={!!fields.phone}
              className="h-12 min-w-0 flex-1 rounded-xl border border-ink-200 px-4 text-sm placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 aria-[invalid=true]:border-red-400"
            />
          </div>
          {fields.phone && <p className="text-xs font-medium text-red-600">{fields.phone}</p>}
          <label htmlFor="hero-email" className="sr-only">Work email</label>
          <input
            id="hero-email"
            type="email"
            autoComplete="email"
            placeholder="Work email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fields.email}
            className="h-12 w-full rounded-xl border border-ink-200 px-4 text-sm placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 aria-[invalid=true]:border-red-400"
          />
          {fields.email && <p className="text-xs font-medium text-red-600">{fields.email}</p>}
          {status === "error" && !fields.phone && !fields.email && error && <p className="text-xs font-medium text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={status === "submitting"}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink-900 text-sm font-semibold text-white transition-colors hover:bg-ink-800 disabled:opacity-60"
          >
            {status === "submitting" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <PhoneCall className="size-4" aria-hidden="true" />}
            Get a call from Devy
          </button>
        </form>
      )}
      <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-400">
        <ShieldCheck className="size-3.5" aria-hidden="true" /> We only use your number for this demo call.
      </p>
    </div>
  );
}
