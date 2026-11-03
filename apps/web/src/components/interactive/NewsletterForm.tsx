"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
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
      <p className="flex items-center gap-2 text-sm text-brand-300">
        <Check className="size-4" /> You are subscribed. Watch your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="flex rounded-full border border-white/15 bg-white/5 p-1 focus-within:border-brand-400">
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
          className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white placeholder:text-ink-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          aria-label="Subscribe"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-400 disabled:opacity-60"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>
      {status === "error" && <p className="mt-2 text-xs text-red-300">{fields.email ?? error}</p>}
    </form>
  );
}
