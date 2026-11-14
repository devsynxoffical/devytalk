"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { z } from "zod";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** `/api/backend/campaigns/My%20Campaign/report` for ("campaigns", "My Campaign", "report"). */
export function backendUrl(segments: (string | number)[], query?: Record<string, string | number | undefined | null>): string {
  const path = segments.map((s) => encodeURIComponent(String(s))).join("/");
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const search = params.toString();
  return `/api/backend/${path}${search ? `?${search}` : ""}`;
}

/** The engine's error text, whatever shape it arrived in. */
export function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const parts = detail.map((d) => (d && typeof d === "object" && "msg" in d ? String((d as { msg: unknown }).msg) : "")).filter(Boolean);
      if (parts.length) return parts.join("; ");
    }
  }
  if (status === 502) return "The calling engine could not be reached.";
  return `The request failed (${status}).`;
}

/** Call the engine through the dashboard proxy and check the answer has the shape the page expects. */
export async function apiRequest<T>(url: string, schema: z.ZodType<T>, init?: { method?: string; body?: unknown; /** a file upload; the browser sets the content type */ form?: FormData; signal?: AbortSignal }): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: init?.method ?? (init?.form ? "POST" : "GET"),
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.form ?? (init?.body !== undefined ? JSON.stringify(init.body) : undefined),
      signal: init?.signal,
      cache: "no-store",
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError("No connection. Check your network and try again.", 0);
  }
  if (response.status === 401) {
    // The session ended: back to sign-in, then return here.
    window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    throw new ApiError("Your session has ended. Sign in again.", 401);
  }
  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(errorMessage(body, response.status), response.status);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error("Unexpected response shape from", url, parsed.error.issues);
    throw new ApiError("The server sent data this page does not understand. The dashboard and the calling engine may be on different versions.", 500);
  }
  return parsed.data;
}

type State<T> = { data: T | null; error: ApiError | null; loading: boolean };

/** Load one resource, with loading and error state and a way to load it again. `url = null` waits. */
export function useApi<T>(url: string | null, schema: z.ZodType<T>) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: url !== null });
  const [version, setVersion] = useState(0);
  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  useEffect(() => {
    if (url === null) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    const controller = new AbortController();
    setState((previous) => ({ data: previous.data, error: null, loading: true }));
    apiRequest(url, schemaRef.current, { signal: controller.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ data: null, error: error instanceof ApiError ? error : new ApiError("Something went wrong.", 500), loading: false });
      });
    return () => controller.abort();
  }, [url, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
