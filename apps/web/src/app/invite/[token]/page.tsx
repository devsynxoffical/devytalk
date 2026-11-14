import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { InviteForm } from "@/components/interactive/InviteForm";
import { callBackendPublic } from "@/lib/server/backend";

export const metadata: Metadata = { title: "Choose your password", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

const previewSchema = z.object({ purpose: z.enum(["join", "reset"]), email: z.string(), name: z.string().default(""), role: z.enum(["viewer", "operator", "admin"]), organization: z.string().default("") });
const ROLE: Record<string, string> = { viewer: "a viewer", operator: "an operator", admin: "an admin" };

type Looked = { state: "ok"; preview: z.infer<typeof previewSchema> } | { state: "gone" } | { state: "unreachable" };

async function look(token: string): Promise<Looked> {
  if (!/^dti_[A-Za-z0-9_-]{20,100}$/.test(token)) return { state: "gone" };
  try {
    const answer = await callBackendPublic(`/api/auth/invitations/${encodeURIComponent(token)}`);
    if (answer.status === 404) return { state: "gone" };
    const preview = previewSchema.safeParse(await answer.json().catch(() => null));
    return answer.ok && preview.success ? { state: "ok", preview: preview.data } : { state: "unreachable" };
  } catch {
    return { state: "unreachable" };
  }
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const looked = await look(token);

  return (
    <div className="app flex min-h-dvh items-center justify-center px-5 py-12 pt-safe">
      <main className="w-full max-w-sm animate-rise">
        <span className="mb-8 grid size-9 place-items-center rounded-[9px] bg-signal" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-5 text-on-signal" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M5 12h.5M8.5 8.5v7M12 5v14M15.5 8.5v7M19 12h.5" />
          </svg>
        </span>
        {looked.state === "ok" ? (
          <>
            <h1 className="t-title text-fg">{looked.preview.purpose === "join" ? `Join ${!looked.preview.organization || looked.preview.organization === "default" ? "the console" : looked.preview.organization}` : "Choose a new password"}</h1>
            <p className="mt-1 text-[13.5px] text-fg-2">
              {looked.preview.purpose === "join" ? (
                <>
                  You were invited as {ROLE[looked.preview.role]}. You sign in as <strong className="font-medium text-fg">{looked.preview.email}</strong>.
                </>
              ) : (
                <>
                  For <strong className="font-medium text-fg">{looked.preview.email}</strong>. You are signed out everywhere else.
                </>
              )}
            </p>
            <InviteForm token={token} purpose={looked.preview.purpose} email={looked.preview.email} name={looked.preview.name} />
          </>
        ) : (
          <>
            <h1 className="t-title text-fg">{looked.state === "gone" ? "This link does not work any more" : "The console could not be reached"}</h1>
            <p className="mt-2 text-[13.5px] text-fg-2" role="alert">
              {looked.state === "gone"
                ? "It was used already, withdrawn, or is too old. Ask the person who sent it for a new one."
                : "Try the link again in a moment. It has not been used."}
            </p>
            <p className="mt-6 text-[13px]">
              <Link href="/login" className="font-medium text-accent hover:underline">
                Go to sign in
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
