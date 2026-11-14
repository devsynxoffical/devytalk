/** What each event means, in the words of someone choosing them. */
export const EVENT_LABELS: Record<string, string> = {
  "appointment.booked": "A meeting is booked",
  "call.finalized": "A call is over and its outcome is known",
  "call.initiated": "A call is placed",
  "call.answered": "A call is answered",
  "call.completed": "A connected call ends",
  "call.failed": "A call does not connect",
  "call.transferred": "A call is handed to a person",
  "campaign.started": "A campaign is started",
  "campaign.paused": "A campaign is paused",
  "campaign.stopped": "A campaign stops by itself",
  "playbook.approved": "A playbook version goes live",
};
/** The order they are offered in: what a CRM usually wants first. */
export function orderedEvents(names: string[]): string[] {
  const known = Object.keys(EVENT_LABELS);
  return [...names].sort((a, b) => (known.indexOf(a) + 1 || 99) - (known.indexOf(b) + 1 || 99) || a.localeCompare(b));
}
export const describeEvents = (events: string[]) => (events.includes("*") ? "Everything" : events.length === 1 ? events[0] : `${events.length} events`);
