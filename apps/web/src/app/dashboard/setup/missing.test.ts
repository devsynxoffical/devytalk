import { describe, expect, it } from "vitest";
import type { EngineStatus } from "@/lib/api/schemas";
import { missingNote } from "./missing";

const base: EngineStatus = { ready_for_calls: false, checks: [], from_number: null, inbound_webhook: null, languages: [], website_intake: false, row_level_security: "unavailable", default_timezone: "UTC" };

describe("the note for whoever runs the engine", () => {
  it("lists each missing connection with the names of its settings, and nothing that is connected", () => {
    const note = missingNote({
      ...base,
      checks: [
        { key: "telephony", label: "Phone provider (Twilio)", purpose: "", ok: false, missing: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"] },
        { key: "stt", label: "Speech recognition (Deepgram)", purpose: "", ok: true, missing: [] },
      ],
    });
    expect(note.split("\n")).toEqual(["DevyTalk cannot place or answer calls yet. These settings are missing on the calling engine:", "- Phone provider (Twilio): TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN"]);
  });

  it("says so when nothing is missing", () => {
    expect(missingNote({ ...base, ready_for_calls: true })).toBe("Everything DevyTalk needs for calls is connected.");
  });
});
