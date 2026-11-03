"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useLeadSubmit } from "./useLeadSubmit";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const { status, error, fields, submit } = useLeadSubmit();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (await submit({ kind: "newsletter", email })) setEmail("");
  }

  if (status === "success") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-brand-700" role="status">
        <Check className="size-4" aria-hidden="true" /> You&apos;re subscribed. Watch your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex rounded-xl border border-ink-200 bg-white p-1 transition-colors focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
        <label htmlFor="newsletter-email" className="sr-only">
          Work email
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          aria-label="Subscribe"
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink-900 text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {status === "submitting" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
        </button>
      </div>
      {status === "error" && <p className="mt-2 text-xs font-medium text-red-600">{fields.email ?? error}</p>}
    </form>
  );
}
