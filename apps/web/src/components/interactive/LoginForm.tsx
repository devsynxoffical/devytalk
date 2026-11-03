"use client";

import { useState, type FormEvent } from "react";
import { Info } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";

const inputClass =
  "w-full rounded-xl border border-ink-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

/** UI only: authentication lands with the DevyTalk app backend. */
export function LoginForm() {
  const [notice, setNotice] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setNotice(true);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-ink-700">Work email</label>
        <input id="login-email" type="email" required autoComplete="email" className={inputClass} />
      </div>
      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-ink-700">Password</label>
        <input id="login-password" type="password" required autoComplete="current-password" className={inputClass} />
      </div>
      {notice && (
        <p className="flex gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-800" role="status">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          The DevyTalk app is not open for sign-in yet. Start a free trial and we will email you when your workspace is ready.
        </p>
      )}
      <button type="submit" className={buttonClass("primary", "lg", "w-full")}>Log in</button>
    </form>
  );
}
