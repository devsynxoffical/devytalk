import { NextResponse, type NextRequest } from "next/server";
import { fieldErrors, leadSchema, type LeadResponse } from "@/lib/lead-schema";
import { saveLead } from "@/lib/lead-store";
import { isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json<LeadResponse>({ ok: false, error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<LeadResponse>({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<LeadResponse>(
      { ok: false, error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const { website: _honeypot, ...lead } = parsed.data;
  try {
    const id = await saveLead(lead, { userAgent: req.headers.get("user-agent") ?? undefined });
    return NextResponse.json<LeadResponse>({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("lead store failed", err instanceof Error ? err.message : "unknown error");
    return NextResponse.json<LeadResponse>({ ok: false, error: "We could not save your request. Please try again." }, { status: 500 });
  }
}
