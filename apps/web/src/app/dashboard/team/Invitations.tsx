"use client";

import { useState, type FormEvent } from "react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { dateTime } from "@/lib/api/format";
import { invitationListSchema, invitationSchema, newInvitationSchema, roleSchema, type Invitation, type Role } from "@/lib/api/schemas";
import { ROLE_LABEL, ROLE_SUMMARY } from "@/components/dashboard/access";
import { CopyField } from "@/components/dashboard/CopyField";
import { Banner, Button, Field, Input, Panel, Select, Status } from "@/components/dashboard/ui";

const ROLES = roleSchema.options;
const sentence = (text: string) => text[0].toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? "" : ".");
const failure = (e: unknown) => sentence(e instanceof ApiError ? e.message : "Something went wrong. Try again.");

/** The address a person opens to use a one-time link. Built here: the engine does not know where the console is served. */
export const inviteLink = (origin: string, token: string) => `${origin.replace(/\/+$/, "")}/invite/${token}`;

export type FreshLink = { email: string; link: string; purpose: "join" | "reset" };

/** A link that was just made. Shown once: it cannot be read back. */
export function LinkBanner({ fresh, onDone }: { fresh: FreshLink; onDone: () => void }) {
  return (
    <Banner tone="pos" title={fresh.purpose === "join" ? `Send this link to ${fresh.email}` : `Send this reset link to ${fresh.email}`} role="status" testId="invite-link" actions={<Button onClick={onDone}>I have copied it</Button>}>
      <p className="mb-3">
        {fresh.purpose === "join"
          ? "It is not sent by email: pass it on yourself. They open it and choose their own password. It works once, for a week."
          : "It is not sent by email: pass it on yourself. They choose a new password and are signed out everywhere else. It works once, for a day."}{" "}
        Whoever has the link gets the account, so send it to them alone.
      </p>
      <CopyField label={fresh.purpose === "join" ? "Invitation link" : "Reset link"} value={fresh.link} />
    </Banner>
  );
}

export function InvitePerson({ onInvited, onClose }: { onInvited: (fresh: FreshLink) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("operator");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function invite(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const made = await apiRequest(backendUrl(["invitations"]), newInvitationSchema, { method: "POST", body: { name: name.trim(), email: email.trim(), role } });
      onInvited({ email: made.email, link: inviteLink(window.location.origin, made.token), purpose: "join" });
      onClose();
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Invite a person" description="You get a link to send them. They choose their own password, which you never see.">
      <form onSubmit={invite} className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0" noValidate>
        <Field label="Their name">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" maxLength={200} />
        </Field>
        <Field label="Their email" hint="What they will sign in with.">
          <Input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required autoFocus />
        </Field>
        <Field label="Role" hint={ROLE_SUMMARY[role]}>
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
        </Field>
        {error && (
          <p className="text-[13px] font-medium text-crit sm:col-span-2" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" variant="primary" busy={busy} disabled={!email.trim()}>
            Make invitation link
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

const STATE_TONE = { pending: "warn", accepted: "pos", withdrawn: "neutral", expired: "neutral" } as const;
const STATE_TEXT = { pending: "Waiting", accepted: "Joined", withdrawn: "Withdrawn", expired: "Expired" } as const;

/** Invitations nobody has used yet, and what became of the recent ones. `version` changes when one was just made. */
export function InvitationList({ version, onChanged }: { version: number; onChanged: (text: string) => void }) {
  const { data, reload } = useApi(backendUrl(["invitations"], { v: version }), invitationListSchema);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown = (data ?? []).filter((i) => i.state === "pending").concat((data ?? []).filter((i) => i.state !== "pending").slice(0, 5));
  if (shown.length === 0) return null;

  async function withdraw(invitation: Invitation) {
    setBusy(invitation.id);
    setError(null);
    try {
      await apiRequest(backendUrl(["invitations", invitation.id]), invitationSchema, { method: "DELETE" });
      onChanged(`The invitation for ${invitation.email} was withdrawn. Its link does not work any more.`);
      reload();
    } catch (e) {
      setError(failure(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Panel title="Invitations" description="Links that were made for people to join.">
      {error && (
        <p className="mb-3 text-[13px] font-medium text-crit" role="alert">
          {error}
        </p>
      )}
      <ul className="divide-y divide-line" data-testid="invitations">
        {shown.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-medium text-fg">{i.name ? `${i.name} · ${i.email}` : i.email}</p>
              <p className="t-meta">
                {ROLE_LABEL[i.role]} · invited by {i.created_by || "the operator"}
                {i.state === "pending" ? ` · works until ${dateTime(i.expires_at)}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Status tone={STATE_TONE[i.state]}>{STATE_TEXT[i.state]}</Status>
              {i.state === "pending" && (
                <Button size="sm" variant="ghost" busy={busy === i.id} onClick={() => withdraw(i)} aria-label={`Withdraw the invitation for ${i.email}`}>
                  Withdraw
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
