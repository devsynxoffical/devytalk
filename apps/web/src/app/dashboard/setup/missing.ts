import type { EngineStatus } from "@/lib/api/schemas";

/** What is still missing, as a note to send to whoever runs the engine. Names of settings only: no value is ever known here. */
export function missingNote(status: EngineStatus): string {
  const lines = status.checks.filter((check) => !check.ok).map((check) => `- ${check.label}: ${check.missing.join(", ")}`);
  if (lines.length === 0) return "Everything DevyTalk needs for calls is connected.";
  return ["DevyTalk cannot place or answer calls yet. These settings are missing on the calling engine:", ...lines].join("\n");
}
