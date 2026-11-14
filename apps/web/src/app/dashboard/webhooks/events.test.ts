import { describe, expect, it } from "vitest";
import { EVENT_LABELS, describeEvents, orderedEvents } from "./events";

describe("webhook events", () => {
  it("offers what a CRM usually wants first, and an event this console does not know yet last", () => {
    const offered = orderedEvents(["playbook.approved", "lead.imported", "call.initiated", "call.finalized", "appointment.booked"]);
    expect(offered).toEqual(["appointment.booked", "call.finalized", "call.initiated", "playbook.approved", "lead.imported"]);
  });

  it("says what an endpoint receives in a few words", () => {
    expect(describeEvents(["*"])).toBe("Everything");
    expect(describeEvents(["call.finalized"])).toBe("call.finalized");
    expect(describeEvents(["call.finalized", "appointment.booked"])).toBe("2 events");
  });

  it("has a plain description for every event the engine sends", () => {
    for (const name of ["call.initiated", "call.answered", "call.completed", "call.failed", "call.finalized", "call.transferred", "appointment.booked", "campaign.started", "campaign.paused", "campaign.stopped", "playbook.approved"]) {
      expect(EVENT_LABELS[name], name).toBeTruthy();
    }
  });
});
