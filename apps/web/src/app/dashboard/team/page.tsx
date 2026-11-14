"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Link2, UserPlus } from "lucide-react";
import { ApiError, apiRequest, backendUrl, useApi } from "@/lib/api/client";
import { dateTime } from "@/lib/api/format";
import { newInvitationSchema, roleSchema, userListSchema, userSchema, type Role, type User } from "@/lib/api/schemas";
import { InvitationList, InvitePerson, LinkBanner, inviteLink, type FreshLink } from "./Invitations";
import { ROLE_LABEL, ROLE_SUMMARY, useAccess } from "@/components/dashboard/access";
import { Banner, Button, Confirm, DataTable, EmptyState, ErrorState, Field, Input, Loading, NoticeBar, PageHeader, Panel, Select, Status, type Column, type Notice } from "@/components/dashboard/ui";

const ROLES = roleSchema.options;
const MIN_PASSWORD = 10;
const failure = (error: unknown) => (error instanceof ApiError ? error.message : "Something went wrong. Try again.");
const sentence = (text: string) => text[0].toUpperCase() + text.slice(1) + (/[.!?]$/.test(text) ? "" : ".");

/** Why a new password will be refused, before it is sent. The engine checks again. */
export function passwordProblem(password: string, email = ""): string | null {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (!password.trim()) return "The password cannot be only spaces.";
  if (email && password.trim().toLowerCase() === email.trim().toLowerCase()) return "The password cannot be the email address.";
  return null;
}

function AddPerson({ onAdded, onClose }: { onAdded: (notice: Notice) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("operator");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weak, setWeak] = useState<string | null>(null);

  async function add(event: FormEvent) {
    event.preventDefault();
    const problem = passwordProblem(password, email);
    setWeak(problem);
    if (problem) return;
    setBusy(true);
    setError(null);
    try {
      const user = await apiRequest(backendUrl(["users"]), userSchema, { method: "POST", body: { name, email, role, password } });
      onAdded({ kind: "success", text: `${user.email} can now sign in as ${ROLE_LABEL[user.role].toLowerCase()}. Give them the password yourself; it is not sent by email.` });
      onClose();
    } catch (e) {
      setError(sentence(failure(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Add a person with a password" description="For when a link cannot be sent. They sign in with this email and the password you set, and should change it afterwards. Otherwise invite them: then nobody but them knows their password.">
      <form onSubmit={add} className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0" noValidate>
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" maxLength={200} />
        </Field>
        <Field label="Email">
          <Input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />
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
        <Field label="First password" hint={`At least ${MIN_PASSWORD} characters.`} error={weak}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </Field>
        {error && (
          <p className="text-[13px] font-medium text-crit sm:col-span-2" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" variant="primary" busy={busy} disabled={!email.trim() || !password}>
            Add person
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

type Pending = { user: User; action: "deactivate" | "activate" | "password" };

export default function TeamPage() {
  const { me, isAdmin } = useAccess();
  const { data, error, loading, reload } = useApi(backendUrl(["users"]), userListSchema);
  const [notice, setNotice] = useState<Notice>(null);
  const closeNotice = useCallback(() => setNotice(null), []);
  const [adding, setAdding] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [fresh, setFresh] = useState<FreshLink | null>(null);
  const [invitations, setInvitations] = useState(0); // counts links made here, so the list reads again
  const [pending, setPending] = useState<Pending | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const changed = (n: Notice) => (setNotice(n), reload());
  const own = (user: User) => me?.kind === "user" && me.id === user.id;

  async function patch(user: User, body: Record<string, unknown>, done: string) {
    setBusy(true);
    setProblem(null);
    try {
      await apiRequest(backendUrl(["users", user.id]), userSchema, { method: "PATCH", body });
      setPending(null);
      setPassword("");
      changed({ kind: "success", text: done });
    } catch (e) {
      const text = sentence(failure(e));
      if (pending) setProblem(text);
      else setNotice({ kind: "error", text });
    } finally {
      setBusy(false);
    }
  }

  async function resetLink(user: User) {
    setBusy(true);
    try {
      const made = await apiRequest(backendUrl(["users", user.id, "reset-link"]), newInvitationSchema, { method: "POST" });
      setFresh({ email: user.email, link: inviteLink(window.location.origin, made.token), purpose: "reset" });
    } catch (e) {
      setNotice({ kind: "error", text: sentence(failure(e)) });
    } finally {
      setBusy(false);
    }
  }

  function confirm() {
    if (!pending) return;
    const { user, action } = pending;
    if (action === "password") {
      const weak = passwordProblem(password, user.email);
      if (weak) return setProblem(weak);
      return patch(user, { password }, `A new password was set for ${user.email}. They were signed out everywhere.`);
    }
    return patch(user, { active: action === "activate" }, action === "activate" ? `${user.email} can sign in again.` : `${user.email} can no longer sign in and was signed out everywhere.`);
  }

  const columns: Column<User>[] = [
    {
      key: "person",
      label: "Person",
      primary: true,
      sortValue: (u) => (u.name || u.email).toLowerCase(),
      render: (u) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium text-fg">
            {u.name || u.email}
            {own(u) && <span className="ml-1.5 font-normal text-fg-3">(you)</span>}
          </span>
          {u.name && <span className="t-meta block truncate">{u.email}</span>}
        </span>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortValue: (u) => u.role,
      render: (u) =>
        own(u) || !u.active ? (
          ROLE_LABEL[u.role]
        ) : (
          <Select aria-label={`Role of ${u.email}`} value={u.role} disabled={busy} className="w-32" onChange={(e) => patch(u, { role: e.target.value }, `${u.email} is now ${ROLE_LABEL[e.target.value as Role].toLowerCase()}.`)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
        ),
    },
    { key: "state", label: "State", sortValue: (u) => Number(u.active), render: (u) => <Status tone={u.active ? "pos" : "neutral"}>{u.active ? "Active" : "Deactivated"}</Status> },
    { key: "seen", label: "Last sign-in", sortValue: (u) => u.last_login_at ?? "", render: (u) => <span className="text-fg-2">{u.last_login_at ? dateTime(u.last_login_at) : "Never"}</span> },
    {
      key: "actions",
      label: "",
      render: (u) =>
        own(u) ? null : (
          <span className="flex flex-wrap justify-end gap-1.5">
            {u.active && (
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => resetLink(u)} aria-label={`Make a reset link for ${u.email}`}>
                Reset link
              </Button>
            )}
            {u.active && (
              <Button size="sm" variant="ghost" onClick={() => (setProblem(null), setPassword(""), setPending({ user: u, action: "password" }))}>
                Reset password
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => (setProblem(null), setPending({ user: u, action: u.active ? "deactivate" : "activate" }))}>
              {u.active ? "Deactivate" : "Reactivate"}
            </Button>
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <NoticeBar notice={notice} onClose={closeNotice} />
      <PageHeader
        title="Team"
        description="Who can sign in to this console, and what each person may do."
        actions={
          isAdmin && !adding && !inviting ? (
            <>
              <Button onClick={() => setAdding(true)}>
                <UserPlus className="size-3.5" aria-hidden="true" />
                Add a person
              </Button>
              <Button variant="primary" onClick={() => setInviting(true)}>
                <Link2 className="size-3.5" aria-hidden="true" />
                Invite by link
              </Button>
            </>
          ) : undefined
        }
      />
      {fresh && <LinkBanner fresh={fresh} onDone={() => setFresh(null)} />}
      {inviting && <InvitePerson onInvited={(link) => (setFresh(link), setInvitations((n) => n + 1))} onClose={() => setInviting(false)} />}
      {adding && <AddPerson onAdded={changed} onClose={() => setAdding(false)} />}

      {loading && !data ? (
        <Loading what="Loading the team" strip={false} rows={4} />
      ) : error ? (
        error.status === 403 ? (
          <Banner tone="warn" title="Only an admin can see and manage the team" role="alert">
            Ask an admin if you need a different role.
          </Banner>
        ) : (
          <ErrorState message={error.message} onRetry={reload} />
        )
      ) : data && data.length === 0 ? (
        <EmptyState title="Nobody has an account yet" action={!adding ? <Button onClick={() => setAdding(true)}>Add the first person</Button> : undefined}>
          You are signed in with the engine&apos;s access token. Add an account for each person, so that actions are recorded under their name and each has only the access they need.
        </EmptyState>
      ) : data ? (
        <Panel title="People" description={`${data.filter((u) => u.active).length} active`} flush>
          {pending && (
            <div className="border-b border-line p-3">
              {pending.action === "password" ? (
                <Confirm label={`Reset the password of ${pending.user.email}`} confirmLabel="Set password" busy={busy} error={problem} onConfirm={confirm} onCancel={() => setPending(null)}>
                  <p>
                    Set a new password for <strong className="font-semibold text-fg">{pending.user.email}</strong>. They are signed out everywhere and sign in again with it.
                  </p>
                  <Field label="New password" className="mt-2 max-w-xs" hint={`At least ${MIN_PASSWORD} characters.`}>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                  </Field>
                </Confirm>
              ) : (
                <Confirm
                  label={`${pending.action === "activate" ? "Reactivate" : "Deactivate"} ${pending.user.email}`}
                  confirmLabel={pending.action === "activate" ? "Reactivate" : "Deactivate"}
                  tone={pending.action === "activate" ? "primary" : "danger"}
                  busy={busy}
                  error={problem}
                  onConfirm={confirm}
                  onCancel={() => setPending(null)}
                >
                  {pending.action === "activate" ? (
                    <>
                      Let <strong className="font-semibold text-fg">{pending.user.email}</strong> sign in again with their role and password?
                    </>
                  ) : (
                    <>
                      Stop <strong className="font-semibold text-fg">{pending.user.email}</strong> signing in? They are signed out everywhere at once. What they did stays on record, and you can reactivate the account later.
                    </>
                  )}
                </Confirm>
              )}
            </div>
          )}
          <DataTable columns={columns} rows={data} rowKey={(u) => u.id} caption="People with an account" testId="team" />
        </Panel>
      ) : null}

      {isAdmin && data && <InvitationList version={invitations} onChanged={(text) => changed({ kind: "success", text })} />}

      <Panel title="What each role may do">
        <dl className="divide-y divide-line">
          {ROLES.map((role) => (
            <div key={role} className="grid grid-cols-1 gap-1 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[8rem_1fr]">
              <dt className="text-[13.5px] font-medium text-fg">{ROLE_LABEL[role]}</dt>
              <dd className="text-[13px] text-fg-2">{ROLE_SUMMARY[role]}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
