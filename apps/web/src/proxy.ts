import { NextResponse, type NextRequest } from "next/server";

/** Dashboard pages need a session. Whether the token is still valid is decided by the engine on every request. */
export function proxy(request: NextRequest) {
  if (!request.cookies.get("dt_session")?.value) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
