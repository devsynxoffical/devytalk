"use client";

import { useState } from "react";
import { fieldErrors, leadSchema, type LeadInput, type LeadResponse } from "@/lib/lead-schema";

type State = { status: "idle" | "submitting" | "success" | "error"; error?: string; fields: Record<string, string> };

export function useLeadSubmit() {
  const [state, setState] = useState<State>({ status: "idle", fields: {} });

  async function submit(input: LeadInput) {
    const parsed = leadSchema.safeParse(input);
    if (!parsed.success) {
      setState({ status: "error", error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) });
      return false;
    }
    setState({ status: "submitting", fields: {} });
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as LeadResponse;
      if (!data.ok) {
        setState({ status: "error", error: data.error, fields: data.fields ?? {} });
        return false;
      }
      setState({ status: "success", fields: {} });
      return true;
    } catch {
      setState({ status: "error", error: "Network error. Check your connection and try again.", fields: {} });
      return false;
    }
  }

  return { ...state, submit };
}
