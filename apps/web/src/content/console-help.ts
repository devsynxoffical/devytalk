/**
 * Plain-language help for the console: what each word means, how the work flows from
 * a new account to a running campaign, and the questions people ask first.
 *
 * One source for three places: the Help page, the small "what is this" hints beside a
 * figure or a column heading, and the search in both. Everything here describes what
 * the product does today; a rule or a number is stated only where the engine applies it.
 */

export type Term = {
  id: string;
  term: string;
  /** One or two sentences, shown in a hint beside the word. */
  short: string;
  /** More, shown on the Help page only. */
  more?: string;
  group: "Basics" | "Results" | "Leads" | "Playbook" | "Calling rules" | "Account";
};

export const GLOSSARY: Term[] = [
  // ---- Basics
  { id: "campaign", group: "Basics", term: "Campaign", short: "One calling project: who the agent calls, what it offers, in which languages and under which rules.", more: "Each campaign has its own leads, playbook, documents, calling rules and results. Run a separate campaign for each audience or offer so their results stay comparable." },
  { id: "agent", group: "Basics", term: "Agent", short: "The AI assistant that speaks on the phone. It always says it is an AI assistant when it introduces itself.", more: "The agent follows the campaign's live playbook and looks facts up in the campaign's documents. It does not invent prices or terms: what it may state is what you wrote down." },
  { id: "lead", group: "Basics", term: "Lead", short: "A person to call: a phone number, usually with a name and company.", more: "Leads are imported into a campaign from a CSV or Excel sheet. The same number can be a lead in more than one campaign." },
  { id: "outbound", group: "Basics", term: "Outbound call", short: "A call the agent places to one of a campaign's leads.", more: "Outbound calls are placed only while the campaign is dialing, inside its calling days and hours, and never to a number on the do-not-call list." },
  { id: "inbound", group: "Basics", term: "Inbound call", short: "A call someone makes to one of your numbers, answered by the agent with a campaign's playbook.", more: "Set the number a campaign answers in its Settings, then point that number at the engine at your phone provider." },
  { id: "connections", group: "Basics", term: "Connections", short: "The four outside services a call needs: a phone line, speech recognition, an AI model and a voice.", more: "The phone provider carries the call, speech recognition turns what the person says into text, the AI model decides what to answer, and the voice speaks the answer. Until all are connected you can prepare campaigns but no call is placed." },
  { id: "background-work", group: "Basics", term: "Background work", short: "Jobs the engine does after or between calls: reviewing a call, sending a booking notification, reading a document.", more: "A job that fails is retried. One that keeps failing is marked “gave up” and waits for you on the Background work page, where you can see why and run it again." },

  // ---- Results
  { id: "answered", group: "Results", term: "Answered call", short: "A call a person picked up. Voicemail, busy and no answer do not count.", },
  { id: "conversion", group: "Results", term: "Conversion", short: "A call that ended in a booked meeting or a closed sale.", more: "Which of the two the agent works towards is the campaign's goal, chosen when the campaign is created." },
  { id: "conversion-rate", group: "Results", term: "Conversion rate", short: "Conversions divided by answered calls. Calls nobody picked up are left out.", },
  { id: "cost-per-conversion", group: "Results", term: "Cost per conversion", short: "What was spent on calls divided by the meetings and sales they produced.", more: "Spend is estimated from the cost per minute and per attempt set under Organization. With only a few conversions the figure swings a lot from one call to the next; the Usage page marks it as too early to rely on below 5 meetings." },
  { id: "agent-quality", group: "Results", term: "Agent quality", short: "How well the agent handled a call, from 0 to 10, given by the automatic review after the call.", more: "The review reads the transcript and marks how the agent listened, answered objections and stayed within the playbook. The figure on a report is the average over reviewed calls." },
  { id: "outcome", group: "Results", term: "Outcome", short: "How a call ended: meeting booked, not interested, call back later, no answer and so on.", },
  { id: "sample", group: "Results", term: "Enough to compare", short: "At least 30 answered calls. Below that a rate is shown but marked, because it can change a lot with the next few calls.", },
  { id: "unsupported", group: "Results", term: "Unsupported statement", short: "Something the agent said on a call that the playbook and documents do not back up.", more: "The review after each call lists these. They are the first thing to fix: add the missing fact to the playbook or documents, or tighten what the agent may say." },
  { id: "handover", group: "Results", term: "Handover", short: "When the agent passes a live call to a person on your team, with a short note on what was said.", more: "Set the number calls are handed to under Organization. The note is kept with the call." },

  // ---- Leads
  { id: "lead-score", group: "Leads", term: "Lead score", short: "0 to 100, worked out from what the person actually said on calls.", more: "Six things raise it: the lead fits your target customer, has a relevant need, is the decision-maker, has a buying timeline, has the budget and expressed interest. A lead with no call evidence yet is unscored, not zero." },
  { id: "hot", group: "Leads", term: "Hot, warm and cold", short: "Hot is a score of 70 or more, cold is below 40 or disqualified, warm is in between.", },
  { id: "unscored", group: "Leads", term: "Unscored", short: "No call with this lead has given evidence yet, so there is nothing to score.", },
  { id: "buying-intent", group: "Leads", term: "Buying intent", short: "How ready to buy the person sounded on the last reviewed call: high, medium or low.", },
  { id: "next-action", group: "Leads", term: "Next action", short: "What the review suggests doing next with this lead, in one line.", },
  { id: "do-not-call", group: "Leads", term: "Do not call", short: "Numbers the agent never calls, in any campaign.", more: "A person who asks on a call not to be called again is added automatically. You can add numbers by hand or import a registry list." },
  { id: "consent", group: "Leads", term: "Consent on record", short: "A noted reason this person may be called: they agreed, or you have an existing relationship.", more: "It is recorded when leads are imported. A campaign can be set to call only leads with consent on record." },

  // ---- Playbook
  { id: "playbook", group: "Playbook", term: "Playbook", short: "What the agent says and how: the opening, the questions, the answers to objections, and what it may state about prices and terms.", },
  { id: "version", group: "Playbook", term: "Playbook version", short: "A saved state of the playbook. Calls use the live version; a new one is a draft until an admin approves it.", more: "Nothing changes on calls until a draft is approved. An approved version can be rolled back." },
  { id: "coach", group: "Playbook", term: "AI coach", short: "Reads the campaign's reviewed calls and proposes a better playbook as a draft, with the evidence for each change.", more: "The coach never changes prices, terms, proof points or compliance lines. You decide whether its draft goes live." },
  { id: "knowledge", group: "Playbook", term: "Knowledge", short: "Your documents and web pages. The agent looks facts up in them during a call instead of guessing.", },
  { id: "ab-test", group: "Playbook", term: "A/B test", short: "Two playbook versions run side by side on new leads, to see which converts better.", more: "A share of new leads hears the new version. The test names a winner only when both sides have enough answered calls." },
  { id: "readiness", group: "Playbook", term: "Readiness", short: "How complete a playbook is, from 0 to 100, with notes on what is missing.", },

  // ---- Calling rules
  { id: "calling-window", group: "Calling rules", term: "Calling days and hours", short: "When the agent may place calls, in each lead's own time zone where it is known.", more: "By default a campaign calls Monday to Saturday. Outside the window the campaign waits; it does not stop." },
  { id: "attempts", group: "Calling rules", term: "Attempts per lead", short: "How many times the agent tries a lead who does not answer, and how long it waits in between.", },
  { id: "budget", group: "Calling rules", term: "Budget", short: "The most a campaign may spend on calls. The agent never starts a call the budget cannot cover.", },
  { id: "paused-itself", group: "Calling rules", term: "Paused itself", short: "The campaign stopped dialing on its own because a limit you set was reached.", more: "This happens when the budget is spent, the target number of meetings is booked, or too many people ask not to be called again. The reason is shown with the campaign. Raise the limit, then start dialing again." },

  // ---- Account
  { id: "roles", group: "Account", term: "Viewer, operator, admin", short: "A viewer reads everything. An operator also runs campaigns. An admin also decides what goes live and manages people.", },
  { id: "statement", group: "Account", term: "Statement", short: "One calendar month of usage: every call and what it cost. A closed month never changes.", more: "A statement is a record of use, not a tax invoice." },
  { id: "api-key", group: "Account", term: "API key", short: "A password for another program, so it can read or change this organization's data.", },
  { id: "webhook", group: "Account", term: "Webhook", short: "A message the engine sends to an address of yours when something happens, such as a call ending or a meeting being booked.", },
  { id: "retention", group: "Account", term: "Retention", short: "After how many days what was said on a call is removed. Results and counts are kept.", },
];

export const TERMS: Record<string, Term> = Object.fromEntries(GLOSSARY.map((term) => [term.id, term]));

export type GuideStep = { title: string; text: string };
export type Guide = { id: string; title: string; summary: string; steps: GuideStep[]; where?: { label: string; href: string } };

/** How the work flows. `href` is a place every account has; a campaign's own pages are reached from the campaign. */
export const GUIDES: Guide[] = [
  {
    id: "first-call",
    title: "From a new account to the first call",
    summary: "Five steps. The first is done once for the whole account; the rest are per campaign.",
    where: { label: "Open Setup", href: "/dashboard/setup" },
    steps: [
      { title: "Connect the four services", text: "A phone line, speech recognition, an AI model and a voice. Setup shows which are connected and what is still missing." },
      { title: "Create a campaign", text: "Say who the agent calls, what it offers and in which language. It starts from exactly what you write and invents nothing." },
      { title: "Check what the agent will say", text: "Open the campaign's Coach & playbook tab and read the live version. Add price lists and FAQs under Knowledge so it can look facts up." },
      { title: "Add the people to call", text: "Import a CSV or Excel sheet with a phone column under Leads. Numbers on the do-not-call list are never called." },
      { title: "Start dialing", text: "Check the calling days, hours and budget under Settings, then choose Start dialing. You can pause at any time; calls in progress finish normally." },
    ],
  },
  {
    id: "improve",
    title: "Make a campaign convert better",
    summary: "The loop that improves results once calls are coming in.",
    steps: [
      { title: "Read the results", text: "The Performance tab shows what converts, which objections come up and why calls were lost." },
      { title: "Listen to what was said", text: "The Calls tab has every transcript with its review. Start with calls that carry an unsupported statement." },
      { title: "Ask the coach", text: "On Coach & playbook, the coach reads the reviewed calls and proposes a draft with the evidence for every change." },
      { title: "Test before you switch", text: "Run the draft as an A/B test on a share of new leads. Make it live when it is clearly ahead." },
    ],
  },
  {
    id: "answer-your-number",
    title: "Let the agent answer your number",
    summary: "The agent can answer calls as well as place them.",
    steps: [
      { title: "Choose the campaign", text: "Callers hear that campaign's playbook and languages." },
      { title: "Enter the number", text: "In the campaign's Settings, under Inbound calls, enter the number to answer." },
      { title: "Point the number at the engine", text: "At your phone provider, set the number's “A call comes in” to the address shown on that page." },
    ],
  },
  {
    id: "team",
    title: "Bring in your team",
    summary: "Each person signs in as themselves, with a role.",
    where: { label: "Open Team", href: "/dashboard/team" },
    steps: [
      { title: "Invite by link", text: "On Team, create an invitation and send the person the link. It works once and expires after 7 days." },
      { title: "Pick the role", text: "Viewer to read, operator to run campaigns, admin to approve playbooks and manage people." },
      { title: "Change it later", text: "Roles can be changed, and a person can be deactivated, at any time. A forgotten password is replaced with a reset link." },
    ],
  },
];

export type Question = { id: string; question: string; answer: string };

export const QUESTIONS: Question[] = [
  { id: "no-calls", question: "I pressed Start dialing and nothing is being called. Why?", answer: "Check four things in order. Setup must show every connection as connected. The campaign needs leads that are still to call. Today and the current time must fall inside the campaign's calling days and hours. And the campaign must not have paused itself on a budget or limit: if it has, the reason is shown beside its name." },
  { id: "human", question: "Will people know they are talking to an AI?", answer: "Yes. The agent says it is an AI assistant when it introduces itself, and it does not claim to be a person if asked. The review after each call checks that the introduction was made." },
  { id: "wrong", question: "What if the agent says something wrong?", answer: "The review after each call lists statements the playbook and documents do not support. They appear under “Needs your attention” on the overview. Add the missing fact to the playbook or the documents, or remove what the agent should not say." },
  { id: "stop", question: "How do I stop calls right now?", answer: "Open the campaign and choose Pause dialing. No new call is placed; calls already in progress finish normally." },
  { id: "dnc", question: "Someone asked never to be called again. What happens?", answer: "The agent ends the call politely and the number goes on the do-not-call list, which applies to every campaign. You can also add numbers yourself under Do not call." },
  { id: "cost", question: "Where do I see what calls cost?", answer: "Each campaign shows its spend against its budget. Usage has the monthly statements with every call. The cost is an estimate from the per-minute and per-attempt prices set under Organization." },
  { id: "languages", question: "Which languages does the agent speak?", answer: "English, Arabic and French. A campaign opens in one language and can follow the person into the others; choose them in the campaign's Settings." },
  { id: "playbook-change", question: "Can the AI change what the agent says on its own?", answer: "No. The coach only writes drafts. A draft goes live when an admin approves it, and an approved version can be rolled back." },
  { id: "keys", question: "Where do I enter the provider keys?", answer: "Not in this console. They are added to the calling engine's own settings by whoever runs it, so they are never shown on a screen. Setup lists exactly which ones are missing." },
];

const words = (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean);

/** Every glossary term, guide and question whose text contains all the words asked for. */
export function searchHelp(query: string): { terms: Term[]; guides: Guide[]; questions: Question[] } {
  const wanted = words(query);
  if (wanted.length === 0) return { terms: GLOSSARY, guides: GUIDES, questions: QUESTIONS };
  const has = (text: string) => {
    const lower = text.toLowerCase();
    return wanted.every((word) => lower.includes(word));
  };
  return {
    terms: GLOSSARY.filter((t) => has(`${t.term} ${t.short} ${t.more ?? ""}`)),
    guides: GUIDES.filter((g) => has(`${g.title} ${g.summary} ${g.steps.map((s) => `${s.title} ${s.text}`).join(" ")}`)),
    questions: QUESTIONS.filter((q) => has(`${q.question} ${q.answer}`)),
  };
}

/**
 * The outside services a call needs, by the key the engine reports them under: what each
 * one does in a call, in plain words, and what to do to connect it. The names of the
 * settings themselves come from the engine, which knows which ones are still missing.
 */
export type Service = { role: string; does: string; steps: string[] };

export const SERVICES: Record<string, Service> = {
  telephony: {
    role: "The phone line",
    does: "Carries the call: dials the person's number, or rings through when someone calls yours.",
    steps: ["Open an account with the phone provider.", "Buy a phone number there that can make and receive voice calls.", "Pass on the account's ID, its secret token and the phone number."],
  },
  stt: {
    role: "The ears",
    does: "Turns what the person says into text, fast enough to answer without an awkward pause.",
    steps: ["Open an account with the speech recognition provider.", "Create an API key there and pass it on."],
  },
  model: {
    role: "The brain",
    does: "Reads what was said and decides what the agent answers. It also reviews calls and writes playbook drafts.",
    steps: ["Open an account with the AI model provider and add credit.", "Create an API key there and pass it on."],
  },
  tts: {
    role: "The voice",
    does: "Speaks the agent's answer aloud, in the voice you choose.",
    steps: ["Open an account with the voice provider.", "Pick a voice, create an API key, and pass on both the key and the voice's ID."],
  },
  public_url: {
    role: "The engine's address",
    does: "The web address the phone provider uses to reach the calling engine while a call is running.",
    steps: ["Give the calling engine a public address that starts with https://.", "Set it on the engine as its public address."],
  },
};
