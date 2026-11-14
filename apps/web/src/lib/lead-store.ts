import "server-only";
import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { BACKEND_URL } from "./server/backend";
import type { Lead } from "./lead-schema";

const DATA_DIR = process.env.LEADS_DIR ?? path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "leads.ndjson");

type Stored = Omit<Lead, "website">;

/** The body the calling engine's intake expects. */
export function intakeBody(lead: Stored) {
  return { kind: lead.kind, email: lead.email, name: lead.name, company: lead.company, phone: lead.phone, team_size: lead.teamSize, message: lead.message };
}

/** Kept on this server's disk: the fallback when the engine cannot take the request. */
async function saveToFile(lead: Stored, meta: { userAgent?: string }) {
  const record = { id: randomUUID(), createdAt: new Date().toISOString(), ...lead, userAgent: meta.userAgent?.slice(0, 300) };
  await mkdir(DATA_DIR, { recursive: true });
  await appendFile(FILE, JSON.stringify(record) + "\n", "utf8");
  return record.id;
}

/**
 * Where a form submission goes.
 *
 * With DEVYTALK_INTAKE_TOKEN set (the same value as INTAKE_TOKEN on the calling
 * engine), it is handed to the engine and appears under Requests in the console. If
 * the engine cannot be reached, or the token is not set, it is written to a file on
 * this server instead, so a visitor's request is never dropped; the log says which.
 */
export async function saveLead(lead: Stored, meta: { userAgent?: string }, send: typeof fetch = fetch): Promise<string> {
  const token = process.env.DEVYTALK_INTAKE_TOKEN;
  if (token) {
    try {
      const response = await send(`${BACKEND_URL}/api/intake/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(intakeBody(lead)),
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      });
      if (response.ok) return String(((await response.json()) as { id: number }).id);
      console.error(`website request not accepted by the calling engine (${response.status}); kept in ${FILE}`);
    } catch {
      console.error(`calling engine not reachable for a website request; kept in ${FILE}`);
    }
  } else {
    console.warn(`DEVYTALK_INTAKE_TOKEN is not set: website requests are only kept in ${FILE} and do not appear in the console`);
  }
  return saveToFile(lead, meta);
}
