"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Field, Input } from "@/components/dashboard/ui";

/** Only same-site paths are followed after sign-in, so a crafted link cannot send someone elsewhere. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/dashboard") && !value.startsWith("//") ? value : "/dashboard";
}

/**
 * Sign in with your own account, or with the access token of the calling engine (the
 * owner's credential, used for first setup). Either is checked by the server and kept
 * in a cookie that page scripts cannot read.
 */
export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [mode, setMode] = useState<"account" | "token">("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "token" ? !token.trim() : !email.trim() || !password) {
      setError(mode === "token" ? "Enter your access token." : "Enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "token" ? { token } : { email, password }),
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
      {mode === "account" ? (
        <>
          <Field label="Email">
            <Input type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error} autoFocus />
          </Field>
          <Field label="Password">
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error} />
          </Field>
        </>
      ) : (
        <Field label="Access token" hint={error ? undefined : "The API token of your calling engine: the API_TOKEN setting, or the api_token file in its data folder."}>
          <Input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} aria-invalid={!!error} className="t-figure" autoFocus />
        </Field>
      )}
      {error && (
        <p className="rounded-control bg-crit-bg px-3 py-2 text-[13px] font-medium text-crit" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" busy={busy} className="w-full">
        Sign in
      </Button>
      <p className="text-[12.5px] text-fg-3">
        {mode === "account" ? "Setting up, or no account yet? " : "Have an account? "}
        <button type="button" className="font-medium text-accent hover:underline" onClick={() => (setMode(mode === "account" ? "token" : "account"), setError(null))}>
          {mode === "account" ? "Use the engine's access token" : "Use your email and password"}
        </button>
      </p>
    </form>
  );
}
