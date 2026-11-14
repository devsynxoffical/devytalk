import "server-only";

/** Where the calling engine (the aicallingagent API) lives. Server-side only: never sent to the browser. */
export const BACKEND_URL = (process.env.DEVYTALK_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

export const SESSION_COOKIE = "dt_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export function sessionCookieOptions() {
  return {
    httpOnly: true, // page scripts can never read the access token
    sameSite: "strict" as const, // not sent on requests started by other sites
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/** One request to the calling engine, authenticated as the signed-in operator. */
export async function callBackend(path: string, token: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(310_000),
  });
}

/** A request to the engine that carries no credential: signing in. */
export async function callBackendPublic(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, { ...init, cache: "no-store", signal: init.signal ?? AbortSignal.timeout(15_000) });
}

/**
 * Turn the path segments of a dashboard request into an engine API path.
 * Only `/api/...` is reachable through the proxy: Twilio webhooks, the media socket
 * and anything else on the engine are not.
 */
export function enginePath(segments: string[]): string | null {
  if (segments.length === 0 || segments.length > 12) return null;
  for (const segment of segments) {
    if (!segment || segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\")) return null;
  }
  // Signing in answers with a session token. It goes through /api/session, which keeps
  // the token in an httpOnly cookie; through this proxy it would reach page scripts.
  if (segments[0] === "auth" && segments[1] === "login") return null;
  return "/api/" + segments.map(encodeURIComponent).join("/");
}

/** True when a state-changing request was started by our own pages. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
