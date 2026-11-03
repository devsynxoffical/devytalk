import "server-only";
import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Lead } from "./lead-schema";

const DATA_DIR = process.env.LEADS_DIR ?? path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "leads.ndjson");

/**
 * Persists a lead as one JSON line. This keeps the marketing site self-contained
 * until the DevyTalk API service exists; swap this for a database or CRM call then.
 */
export async function saveLead(lead: Omit<Lead, "website">, meta: { userAgent?: string }) {
  const record = { id: randomUUID(), createdAt: new Date().toISOString(), ...lead, userAgent: meta.userAgent?.slice(0, 300) };
  await mkdir(DATA_DIR, { recursive: true });
  await appendFile(FILE, JSON.stringify(record) + "\n", "utf8");
  return record.id;
}
