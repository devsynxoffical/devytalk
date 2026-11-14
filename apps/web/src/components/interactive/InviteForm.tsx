"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Field, Input } from "@/components/dashboard/ui";

const MIN_PASSWORD = 10;

/** Why the password will be refused, before it is sent. The engine checks again. */
export function inviteProblem(password: string, again: string, email: string): string | null {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (!password.trim()) return "The password cannot be only spaces.";
  if (password.trim().toLowerCase() === email.trim().toLowerCase()) return "The password cannot be your email address.";
  if (password !== again) return "The two passwords are not the same.";
  return null;
}

/** The person holding a one-time link chooses their password, and is signed in. */
export function InviteForm({ token, purpose, email, name: suggested }: { token: string; purpose: "join" | "reset"; email: string; name: string }) {
  const router = useRouter();
  const [name, setName] = useState(suggested);
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const problem = inviteProblem(password, again, email);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/session/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purpose === "join" && name.trim() ? { token, password, name } : { token, password }),
      });
      if (response.ok) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "That did not work. Try again.");
    } catch {
      setError("No connection. Check your network and try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
      {/* Lets a password manager file the new password under the right account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      {purpose === "join" && (
        <Field label="Your name">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={200} />
        </Field>
      )}
      <Field label={purpose === "join" ? "Choose a password" : "New password"} hint={`At least ${MIN_PASSWORD} characters. Nobody else sees it.`}>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" aria-invalid={!!error} autoFocus />
      </Field>
      <Field label="The same password again">
        <Input type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" aria-invalid={!!error} />
      </Field>
      {error && (
        <p className="rounded-control bg-crit-bg px-3 py-2 text-[13px] font-medium text-crit" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" busy={busy} className="w-full">
        {purpose === "join" ? "Create my account" : "Set password and sign in"}
      </Button>
    </form>
  );
}
