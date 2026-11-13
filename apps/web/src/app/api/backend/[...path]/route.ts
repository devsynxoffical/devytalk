import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { callBackend, enginePath, isSameOrigin, SESSION_COOKIE } from "@/lib/server/backend";

export const runtime = "nodejs";
export const maxDuration = 300;

type Context = { params: Promise<{ path: string[] }> };

/**
 * The dashboard's only way to the calling engine. The browser never holds a provider
 * key and never talks to the engine directly: it calls this route, which adds the
 * operator's access token from the httpOnly session cookie.
 */
async function forward(request: NextRequest, context: Context) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ detail: "Sign in to continue." }, { status: 401 });
  if (request.method !== "GET" && !isSameOrigin(request)) {
    return NextResponse.json({ detail: "Request not allowed." }, { status: 403 });
  }
  const path = enginePath((await context.params).path);
  if (!path) return NextResponse.json({ detail: "Not found." }, { status: 404 });

  const init: RequestInit = { method: request.method };
  if (request.method !== "GET") {
    const body = await request.text();
    if (body) {
      init.body = body;
      init.headers = { "Content-Type": "application/json" };
    }
  }
  let upstream: Response;
  try {
    upstream = await callBackend(path + request.nextUrl.search, token, init);
  } catch {
    return NextResponse.json({ detail: "The calling engine could not be reached." }, { status: 502 });
  }
  if (upstream.status === 401) {
    const response = NextResponse.json({ detail: "Your session has ended. Sign in again." }, { status: 401 });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
  if (upstream.status === 204) return new NextResponse(null, { status: 204 });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" },
  });
}

export { forward as GET, forward as POST, forward as PUT, forward as DELETE };
