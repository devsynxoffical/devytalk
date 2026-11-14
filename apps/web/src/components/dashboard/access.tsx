"use client";

import { createContext, useContext, type ReactNode } from "react";
import { backendUrl, useApi } from "@/lib/api/client";
import { meSchema, type Me, type Role } from "@/lib/api/schemas";

/**
 * What the signed-in person may do, so the console does not offer buttons the engine
 * would refuse. This is a courtesy, not the control: the engine checks the role on
 * every request, whatever the page shows.
 */
type Access = {
  me: Me | null;
  /** Start and pause dialing, call a number, import leads, manage knowledge, ask the coach, run A/B tests. */
  canOperate: boolean;
  /** Approve, reject and roll back playbooks, promote a test, change rules and budget, manage people. */
  isAdmin: boolean;
};

const RANK: Record<Role, number> = { viewer: 0, operator: 1, admin: 2 };
export const ROLE_LABEL: Record<Role, string> = { viewer: "Viewer", operator: "Operator", admin: "Admin" };
export const ROLE_SUMMARY: Record<Role, string> = {
  viewer: "Reads everything: results, leads, calls, playbooks.",
  operator: "Also runs campaigns: starts and pauses dialing, calls a number, imports leads, manages documents, asks the coach, runs A/B tests.",
  admin: "Also decides what goes live (approve, reject, roll back, promote), sets calling rules and budgets, and manages people.",
};

export function accessOf(me: Me | null): Access {
  const rank = me ? RANK[me.role] : -1;
  return { me, canOperate: rank >= RANK.operator, isAdmin: rank >= RANK.admin };
}

const AccessContext = createContext<Access>(accessOf(null));

export function AccessProvider({ children }: { children: ReactNode }) {
  const { data } = useApi(backendUrl(["auth", "me"]), meSchema);
  return <AccessContext.Provider value={accessOf(data)}>{children}</AccessContext.Provider>;
}

export function useAccess(): Access {
  return useContext(AccessContext);
}

/** Up to two letters for the account button. */
export function initials(me: Me | null): string {
  if (!me) return "";
  if (me.kind === "token") return "API";
  const words = (me.name || me.email.split("@")[0]).split(/[\s._-]+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase() || "?";
}
