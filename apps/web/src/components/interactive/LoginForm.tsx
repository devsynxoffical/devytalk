"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Field, Input } from "@/components/dashboard/ui";

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
    <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
      <Field label="Access token" hint={error ? undefined : "The API token of your calling engine: the API_TOKEN setting, or the api_token file in its data folder."}>
        <Input type="password" autoComplete="current-password" value={token} onChange={(e) => setToken(e.target.value)} aria-invalid={!!error} className="t-figure" autoFocus />
      </Field>
      {error && (
        <p className="rounded-control bg-crit-bg px-3 py-2 text-[13px] font-medium text-crit" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" busy={busy} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
