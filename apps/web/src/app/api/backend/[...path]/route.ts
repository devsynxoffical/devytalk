import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { callBackend, enginePath, isSameOrigin, SESSION_COOKIE } from "@/lib/server/backend";

export const runtime = "nodejs";
export const maxDuration = 300;

type Context = { params: Promise<{ path: string[] }> };

/** The engine accepts files up to 25 MB; the form fields around the file need a little room. */
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024 + 64 * 1024;
const MAX_JSON_BYTES = 1024 * 1024;

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
    const type = request.headers.get("content-type") ?? "";
    if (type.startsWith("multipart/form-data")) {
      // A file upload (a training document or a lead list): passed through unchanged.
      if (Number(request.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ detail: "The file is larger than 25 MB." }, { status: 413 });
      }
      const upload = await request.arrayBuffer();
      if (upload.byteLength > MAX_UPLOAD_BYTES) return NextResponse.json({ detail: "The file is larger than 25 MB." }, { status: 413 });
      init.body = upload;
      init.headers = { "Content-Type": type };
    } else {
      // Everything the console sends as JSON is small (rules, a playbook, a form).
      if (Number(request.headers.get("content-length") ?? 0) > MAX_JSON_BYTES) {
        return NextResponse.json({ detail: "The request is too large." }, { status: 413 });
      }
      const body = await request.text();
      if (body.length > MAX_JSON_BYTES) return NextResponse.json({ detail: "The request is too large." }, { status: 413 });
      if (body) {
        init.body = body;
        init.headers = { "Content-Type": "application/json" };
      }
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

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
