"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";

const inputClass =
  "w-full rounded-xl border border-ink-200 px-4 py-3 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

/** Only same-site paths are followed after sign-in, so a crafted link cannot send someone elsewhere. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/dashboard") && !value.startsWith("//") ? value : "/dashboard";
}

/**
 * Sign in with the access token of your DevyTalk calling engine. The token is checked
 * by the server and kept in a cookie that page scripts cannot read.
 */
export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token.trim()) {
      setError("Enter your access token.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Sign-in failed. Try again.");
    } catch {
      setError("No connection. Check your network and try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
      <div>
        <label htmlFor="login-token" className="mb-1.5 block text-sm font-semibold text-ink-700">
          Access token
        </label>
        <input
          id="login-token"
          type="password"
          autoComplete="current-password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "login-error" : "login-help"}
          className={inputClass}
        />
        <p id="login-help" className="mt-1.5 text-xs text-ink-500">
          The API token of your calling engine (the <code>API_TOKEN</code> setting, or the <code>api_token</code> file in its data folder).
        </p>
      </div>
      {error && (
        <p id="login-error" className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className={buttonClass("primary", "lg", "w-full")}>
        {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Sign in
      </button>
    </form>
  );
}
