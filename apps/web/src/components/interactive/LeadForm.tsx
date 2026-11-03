"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { teamSizes, type LeadInput } from "@/lib/lead-schema";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useLeadSubmit } from "./useLeadSubmit";

type Kind = "demo" | "trial" | "contact";

const copy: Record<Kind, { button: string; doneTitle: string; doneBody: string }> = {
  demo: {
    button: "Book my demo",
    doneTitle: "Your demo request is in",
    doneBody: "A product specialist will email you within one business day to pick a time that suits you.",
  },
  trial: {
    button: "Create my free account",
    doneTitle: "Check your inbox",
    doneBody: "We sent you a link to verify your email and finish setting up your 14-day trial.",
  },
  contact: {
    button: "Send message",
    doneTitle: "Message received",
    doneBody: "Thanks for reaching out. Our team usually replies within a few hours.",
  },
};

const inputClass =
  "w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-ink-700">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function LeadForm({ kind }: { kind: Kind }) {
  const [values, setValues] = useState<Omit<LeadInput, "kind">>({ email: "", name: "", company: "", phone: "", message: "", website: "" });
  const { status, error, fields, submit } = useLeadSubmit();
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await submit({ ...values, kind, teamSize: values.teamSize || undefined });
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center py-10 text-center" role="status">
        <CheckCircle2 className="size-14 text-brand-500" aria-hidden="true" />
        <h3 className="mt-4 text-2xl font-bold text-ink-900">{copy[kind].doneTitle}</h3>
        <p className="mt-2 max-w-sm text-ink-500">{copy[kind].doneBody}</p>
        <Link href="/" className={buttonClass("outline", "md", "mt-6")}>
          Back to home
        </Link>
      </div>
    );
  }

  const aria = (name: string) => (fields[name] ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {});

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" error={fields.name}>
          <input id="name" autoComplete="name" className={inputClass} value={values.name} onChange={set("name")} {...aria("name")} />
        </Field>
        <Field label="Work email" name="email" error={fields.email}>
          <input id="email" type="email" autoComplete="email" className={inputClass} value={values.email} onChange={set("email")} {...aria("email")} />
        </Field>
      </div>
      {kind !== "contact" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company" name="company" error={fields.company}>
            <input id="company" autoComplete="organization" className={inputClass} value={values.company} onChange={set("company")} {...aria("company")} />
          </Field>
          <Field label="Team size" name="teamSize" error={fields.teamSize}>
            <select id="teamSize" className={inputClass} value={values.teamSize ?? ""} onChange={set("teamSize")}>
              <option value="">Select…</option>
              {teamSizes.map((s) => (
                <option key={s} value={s}>
                  {s} agents
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
      {kind === "demo" && (
        <Field label="Phone (optional)" name="phone" error={fields.phone}>
          <input id="phone" type="tel" autoComplete="tel" className={inputClass} value={values.phone} onChange={set("phone")} {...aria("phone")} />
        </Field>
      )}
      {kind !== "trial" && (
        <Field label={kind === "demo" ? "What would you like to see? (optional)" : "Message"} name="message" error={fields.message}>
          <textarea id="message" rows={4} className={inputClass} value={values.message} onChange={set("message")} {...aria("message")} />
        </Field>
      )}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
      </div>

      {status === "error" && error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={status === "submitting"} className={buttonClass("primary", "lg", "w-full")}>
        {status === "submitting" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {copy[kind].button}
      </button>
      <p className={cn("text-center text-xs text-ink-400")}>
        By submitting you agree to our{" "}
        <Link href="/legal/terms" className="underline hover:text-ink-700">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="underline hover:text-ink-700">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
