"use client";

import { useState, type FormEvent } from "react";
import { ApiError, apiRequest, backendUrl } from "@/lib/api/client";
import { okSchema } from "@/lib/api/schemas";
import { ROLE_LABEL, ROLE_SUMMARY, useAccess } from "@/components/dashboard/access";
import { Banner, Button, Field, Input, KeyValues, PageHeader, Panel } from "@/components/dashboard/ui";
import { passwordProblem } from "../team/page";

export default function AccountPage() {
  const { me } = useAccess();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function change(event: FormEvent) {
    event.preventDefault();
    setDone(false);
    const weak = passwordProblem(next, me?.email);
    if (weak) return setError(weak);
    if (next !== again) return setError("The two new passwords do not match.");
    setBusy(true);
    setError(null);
    try {
      await apiRequest(backendUrl(["auth", "password"]), okSchema, { method: "POST", body: { current_password: current, new_password: next } });
      setDone(true);
      setCurrent("");
      setNext("");
      setAgain("");
    } catch (e) {
      const text = e instanceof ApiError ? e.message : "Something went wrong. Try again.";
      setError(text[0].toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? "" : "."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Your account" description="Who you are signed in as, and your password." />
      {me && (
        <Panel title="Signed in as">
          <KeyValues
            rows={
              me.kind === "token"
                ? [
                    ["Credential", "The engine's access token"],
                    ["Access", "Full access. Use it for setup; give each person their own account under Team."],
                  ]
                : [
                    ["Name", me.name || "Not set"],
                    ["Email", me.email],
                    ["Role", `${ROLE_LABEL[me.role]}. ${ROLE_SUMMARY[me.role]}`],
                  ]
            }
          />
        </Panel>
      )}
      {me?.kind === "user" && (
        <Panel title="Change password" description="Your other sign-ins, on other devices and browsers, are ended.">
          <form onSubmit={change} className="max-w-sm space-y-4" noValidate>
            <Field label="Current password">
              <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="New password" hint="At least 10 characters.">
              <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
            </Field>
            <Field label="New password again">
              <Input type="password" value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
            </Field>
            {error && (
              <p className="text-[13px] font-medium text-crit" role="alert">
                {error}
              </p>
            )}
            {done && (
              <Banner tone="pos" title="Your password was changed" role="status">
                Use the new one the next time you sign in.
              </Banner>
            )}
            <Button type="submit" variant="primary" busy={busy} disabled={!current || !next || !again}>
              Change password
            </Button>
          </form>
        </Panel>
      )}
    </div>
  );
}
