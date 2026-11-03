export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Sales" | "Support" | "Product" | "Guides";
  date: string;
  readMinutes: number;
  body: { heading?: string; text: string }[];
};

export const posts: Post[] = [
  {
    slug: "power-vs-parallel-dialer",
    title: "Power dialer vs. parallel dialer: which one does your team need?",
    excerpt: "Both remove manual dialing. The right choice depends on list quality, team size and how much ringing you are willing to tolerate.",
    category: "Sales",
    date: "2026-10-21",
    readMinutes: 6,
    body: [
      { text: "Manual dialing is the single biggest time sink in outbound sales. Dialers fix that, but not all dialers work the same way." },
      { heading: "How a power dialer works", text: "A power dialer calls one contact at a time and moves to the next number as soon as the previous call ends. Reps hear every ring, which keeps them in control and makes it ideal for warm lists and account-based outreach." },
      { heading: "How a parallel dialer works", text: "A parallel dialer calls several contacts at once and connects the rep to whoever answers first. It shines on large, cold lists where most calls go unanswered." },
      { heading: "Choosing between them", text: "Start with a power dialer if your lists are curated and each call is high-value. Switch on parallel dialing for high-volume prospecting where connect rate is the bottleneck. Many teams use both, per campaign." },
    ],
  },
  {
    slug: "ivr-best-practices",
    title: "9 IVR best practices that callers will actually thank you for",
    excerpt: "Short menus, clear options and an escape hatch to a human. Here is how to design an IVR that reduces frustration.",
    category: "Support",
    date: "2026-10-08",
    readMinutes: 5,
    body: [
      { text: "A good IVR is invisible: callers get where they need to go without thinking about it." },
      { heading: "Keep menus short", text: "Offer no more than four options per level and put the most common reason first." },
      { heading: "Always offer a human", text: "Let callers press 0 to reach an agent at any point. Trapping people in a menu is the fastest way to lose them." },
      { heading: "Use what you already know", text: "If the caller's number matches a customer record, skip the questions you already have answers to." },
    ],
  },
  {
    slug: "call-center-kpis",
    title: "The 12 call center KPIs worth tracking in 2026",
    excerpt: "From service level to first-call resolution, these are the metrics that separate busy teams from effective ones.",
    category: "Guides",
    date: "2026-09-24",
    readMinutes: 8,
    body: [
      { text: "Dashboards can show hundreds of numbers. A handful actually drive decisions." },
      { heading: "Service level", text: "The percentage of calls answered within a target time, for example 80% within 20 seconds. It is the clearest single view of queue health." },
      { heading: "First-call resolution", text: "How often a customer's issue is solved without a follow-up. It correlates strongly with satisfaction." },
      { heading: "Abandonment rate", text: "Callers who hang up before reaching an agent. Watch it by hour to staff peaks properly." },
    ],
  },
  {
    slug: "introducing-ai-voice-agent",
    title: "Introducing the DevyTalk AI Voice Agent",
    excerpt: "A voice agent that answers, qualifies and books meetings around the clock, and hands off to your team with full context.",
    category: "Product",
    date: "2026-09-10",
    readMinutes: 4,
    body: [
      { text: "Today we are launching the AI Voice Agent, available as an add-on on every plan." },
      { heading: "What it does", text: "It answers inbound calls, handles common questions from your knowledge base, qualifies leads and books meetings straight into your calendar." },
      { heading: "Humans stay in the loop", text: "When a caller needs a person, the agent transfers the call to the right queue with a summary of the conversation so far." },
    ],
  },
  {
    slug: "local-presence-dialing",
    title: "Does local presence dialing really improve answer rates?",
    excerpt: "We looked at outbound calls across our platform to see how much a local caller ID matters.",
    category: "Sales",
    date: "2026-08-27",
    readMinutes: 5,
    body: [
      { text: "People are more likely to answer a number that looks local. But how much more, and does it hold up over time?" },
      { heading: "What we measured", text: "We compared answer rates for calls placed from local numbers versus a single national number, across similar lists and times of day." },
      { heading: "Keep reputation healthy", text: "Local presence works best with number pools that rotate caller IDs, combined with sensible daily call caps per number." },
    ],
  },
  {
    slug: "remote-support-team-setup",
    title: "How to set up a remote support phone team in one afternoon",
    excerpt: "A practical checklist: numbers, queues, IVR, recording and the reports you will want on day one.",
    category: "Guides",
    date: "2026-08-12",
    readMinutes: 7,
    body: [
      { text: "You do not need desk phones or an office to run a professional support line." },
      { heading: "1. Pick your numbers", text: "Choose a local or toll-free number for each market, or port the numbers you already use." },
      { heading: "2. Create queues and an IVR", text: "Map the top reasons customers call to queues, then build a short menu in front of them." },
      { heading: "3. Invite agents and go live", text: "Agents log in from the browser, set their status and start taking calls. Turn on the wallboard so everyone can see the queue." },
    ],
  },
];

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}
