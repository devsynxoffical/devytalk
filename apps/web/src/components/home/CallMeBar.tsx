"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, PhoneCall } from "lucide-react";
import { useLeadSubmit } from "@/components/interactive/useLeadSubmit";
import { cn } from "@/lib/cn";

const CODES = [
  { code: "+1", flag: "🇺🇸" },
  { code: "+44", flag: "🇬🇧" },
  { code: "+49", flag: "🇩🇪" },
  { code: "+33", flag: "🇫🇷" },
  { code: "+34", flag: "🇪🇸" },
  { code: "+971", flag: "🇦🇪" },
  { code: "+92", flag: "🇵🇰" },
  { code: "+91", flag: "🇮🇳" },
  { code: "+61", flag: "🇦🇺" },
];

/** Inline "let the AI agent call me" form. Stores a callback request through /api/leads. */
export function CallMeBar() {
  const [code, setCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const { status, error, fields, submit } = useLeadSubmit();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await submit({ kind: "callback", phone: `${code} ${phone}`.trim() });
  }

  if (status === "success") {
    return (
      <p role="status" className="mx-auto flex w-fit animate-[menuPanel_.3s_ease] items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-5 py-3 text-sm font-medium text-brand-800">
        <CheckCircle2 className="size-4" aria-hidden="true" /> Got it. Devy will call {code} {phone} in a moment.
      </p>
    );
  }

  const message = fields.phone ?? (status === "error" ? error : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto w-full max-w-md">
      <div
        className={cn(
          "flex items-center gap-1 rounded-full border bg-white/90 p-1.5 pl-2 shadow-[0_8px_30px_-12px_rgb(10_22_40/0.25)] backdrop-blur transition-all focus-within:ring-4 focus-within:ring-brand-100",
          message ? "border-red-300" : "border-ink-200 focus-within:border-brand-400",
        )}
      >
        <label htmlFor="callme-code" className="sr-only">Country code</label>
        <select
          id="callme-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-9 cursor-pointer rounded-full bg-transparent pl-2 text-sm text-ink-700 focus:outline-none"
        >
          {CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>
        <span className="h-5 w-px bg-ink-200" aria-hidden="true" />
        <label htmlFor="callme-phone" className="sr-only">Your phone number</label>
        <input
          id="callme-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="Your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={!!message}
          aria-describedby={message ? "callme-error" : undefined}
          className="h-9 min-w-0 flex-1 bg-transparent px-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="group relative inline-flex h-10 shrink-0 items-center gap-2 overflow-hidden rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          <span className="absolute inset-y-0 left-0 w-8 animate-[shimmer_2.8s_ease-in-out_infinite] bg-white/25" aria-hidden="true" />
          {status === "submitting" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <PhoneCall className="size-4" aria-hidden="true" />}
          Call me
        </button>
      </div>
      {message && (
        <p id="callme-error" className="mt-2 text-center text-xs font-medium text-red-600">
          {message}
        </p>
      )}
    </form>
  );
}
