import {
  AudioLines,
  BarChart3,
  Bot,
  Globe2,
  Headphones,
  MessageSquareText,
  Mic,
  PhoneForwarded,
  PhoneOutgoing,
  Route,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type FeatureGroup = "Calling" | "Routing" | "Insights" | "AI";

export type Feature = {
  slug: string;
  name: string;
  group: FeatureGroup;
  icon: LucideIcon;
  short: string;
  headline: string;
  intro: string;
  highlights: { title: string; body: string }[];
  stat: { value: string; label: string };
};

export const features: Feature[] = [
  {
    slug: "cloud-call-center",
    name: "Cloud Call Center",
    group: "Calling",
    icon: Headphones,
    short: "A complete contact center in the browser. No hardware, no installs.",
    headline: "Run your whole call center from a browser tab",
    intro:
      "Spin up a team, buy numbers and start taking calls in minutes. DevyTalk handles queues, presence, transfers and recordings so your agents can focus on the conversation.",
    highlights: [
      { title: "Browser & desktop softphone", body: "WebRTC calling with HD audio, noise suppression and a keyboard-first dialer." },
      { title: "Warm & cold transfers", body: "Hand a call to a colleague or a queue with full context attached." },
      { title: "Live presence", body: "See who is available, on a call, wrapping up or away, in real time." },
      { title: "Call notes & tags", body: "Capture outcomes during the call and sync them to your CRM automatically." },
    ],
    stat: { value: "5 min", label: "average time to first call" },
  },
  {
    slug: "power-dialer",
    name: "Power Dialer",
    group: "Calling",
    icon: PhoneOutgoing,
    short: "Work through call lists automatically with zero manual dialing.",
    headline: "Dial more prospects with less clicking",
    intro:
      "Load a list from your CRM or a CSV and let the Power Dialer queue up the next contact the moment a call ends. Reps stay in flow, managers get predictable activity.",
    highlights: [
      { title: "Campaign lists", body: "Build lists from CRM views, filters or uploads and assign them to teams." },
      { title: "Auto wrap-up timers", body: "Give reps a configurable window to log notes before the next dial." },
      { title: "Voicemail drop", body: "Leave a pre-recorded message with a single click and move on." },
      { title: "Local presence", body: "Call from a number local to the prospect to lift answer rates." },
    ],
    stat: { value: "3x", label: "more conversations per rep per day" },
  },
  {
    slug: "parallel-dialer",
    name: "Parallel Dialer",
    group: "Calling",
    icon: PhoneForwarded,
    short: "Dial several numbers at once and connect reps only to humans.",
    headline: "Skip the ringing. Talk to people who pick up",
    intro:
      "The Parallel Dialer calls multiple contacts at the same time and connects the rep to the first live answer, filtering out busy tones, voicemail and unanswered calls.",
    highlights: [
      { title: "Up to 5 lines per rep", body: "Tune concurrency per campaign to match your list quality." },
      { title: "Answering machine detection", body: "Machines are filtered so reps hear a human on connect." },
      { title: "Compliance controls", body: "Calling windows, DNC lists and abandonment caps built in." },
      { title: "Instant context", body: "The contact card pops on connect so the rep never fumbles the opener." },
    ],
    stat: { value: "+60%", label: "connect rate vs. manual dialing" },
  },
  {
    slug: "ivr",
    name: "IVR Builder",
    group: "Routing",
    icon: Workflow,
    short: "Design multi-level phone menus with a drag-and-drop flow editor.",
    headline: "Greet every caller with a menu that makes sense",
    intro:
      "Build interactive voice menus visually. Combine greetings, key presses, business hours and conditions to send each caller to exactly the right place.",
    highlights: [
      { title: "Visual flow editor", body: "Drag nodes, connect branches and preview the path before you publish." },
      { title: "Text-to-speech in 40+ languages", body: "Type your greeting and pick a natural-sounding voice." },
      { title: "Business hours & holidays", body: "Route differently after hours, on weekends or on public holidays." },
      { title: "Version history", body: "Roll back to any previous flow in one click." },
    ],
    stat: { value: "-35%", label: "misrouted calls" },
  },
  {
    slug: "smart-routing",
    name: "Smart Call Routing",
    group: "Routing",
    icon: Route,
    short: "Route by skill, language, VIP status or the last agent spoken to.",
    headline: "Connect callers to the best person, first time",
    intro:
      "Set rules that look at who is calling and who is available. Route by skills, language, CRM owner, customer value or simple round-robin.",
    highlights: [
      { title: "Skill-based routing", body: "Match the caller's need to agents with the right skill tags." },
      { title: "Sticky agent", body: "Returning callers reach the rep they spoke to last." },
      { title: "VIP priority", body: "Pull high-value accounts to the front of the queue automatically." },
      { title: "Overflow rules", body: "Spill over to backup teams, voicemail or a callback request." },
    ],
    stat: { value: "-42%", label: "average wait time" },
  },
  {
    slug: "call-recording",
    name: "Call Recording",
    group: "Insights",
    icon: Mic,
    short: "Record, store and search every call with granular retention rules.",
    headline: "Every call recorded, searchable and secure",
    intro:
      "Automatic recording for inbound and outbound calls, with per-team consent messages, pause-and-resume for sensitive data and encrypted storage.",
    highlights: [
      { title: "Pause for payments", body: "Stop recording while card details are shared, then resume." },
      { title: "Retention policies", body: "Keep recordings 30 days or 7 years. You decide per team." },
      { title: "Shareable clips", body: "Send a timestamped snippet to a colleague for coaching." },
      { title: "Encrypted at rest", body: "AES-256 storage in the EU or US region of your choice." },
    ],
    stat: { value: "100%", label: "of calls captured automatically" },
  },
  {
    slug: "analytics",
    name: "Analytics & Wallboards",
    group: "Insights",
    icon: BarChart3,
    short: "Live dashboards and historical reports on every call and agent.",
    headline: "Know what is happening on the phones, right now",
    intro:
      "Real-time wallboards show queues, missed calls and agent status. Historical reports reveal trends in volume, service level and conversion.",
    highlights: [
      { title: "Live wallboards", body: "Put queue health on a TV screen or in a browser tab." },
      { title: "Service level tracking", body: "Measure answer time against targets per queue." },
      { title: "Agent scorecards", body: "Talk time, calls handled, outcomes and availability per rep." },
      { title: "Scheduled exports", body: "Email CSV reports daily or push them to your data warehouse." },
    ],
    stat: { value: "30+", label: "ready-made reports" },
  },
  {
    slug: "conversation-intelligence",
    name: "Conversation Intelligence",
    group: "AI",
    icon: AudioLines,
    short: "Transcripts, summaries, sentiment and topics for every call.",
    headline: "Turn every conversation into searchable insight",
    intro:
      "Each call is transcribed, summarised and scored. Find objections, competitor mentions and coaching moments without listening to hours of audio.",
    highlights: [
      { title: "Accurate transcripts", body: "Speaker-separated transcripts in 30+ languages." },
      { title: "AI call summaries", body: "Next steps and key facts written to the CRM after hang-up." },
      { title: "Sentiment & talk ratio", body: "Spot frustrated customers and reps who talk too much." },
      { title: "Keyword alerts", body: "Get notified when a call mentions a competitor or 'cancel'." },
    ],
    stat: { value: "2 hrs", label: "saved per rep every week" },
  },
  {
    slug: "ai-voice-agent",
    name: "AI Voice Agent",
    group: "AI",
    icon: Bot,
    short: "A voice agent that answers, qualifies and books meetings 24/7.",
    headline: "An AI teammate that never misses a call",
    intro:
      "Deploy a natural-sounding voice agent that answers FAQs, qualifies leads and books meetings, then hands off to a human with a full summary when needed.",
    highlights: [
      { title: "Trained on your knowledge", body: "Point it at your help center and it answers in your tone." },
      { title: "Calendar booking", body: "Checks availability and books meetings during the call." },
      { title: "Human handoff", body: "Escalates to the right queue with transcript and intent attached." },
      { title: "Guardrails", body: "Define what it may and may not say, and review every call." },
    ],
    stat: { value: "24/7", label: "coverage without extra headcount" },
  },
  {
    slug: "sms-whatsapp",
    name: "SMS & WhatsApp",
    group: "Calling",
    icon: MessageSquareText,
    short: "Text customers from the same number and the same inbox.",
    headline: "Calls and messages in one conversation thread",
    intro:
      "Send and receive SMS and WhatsApp messages from your business numbers. Every message sits beside the call history for complete context.",
    highlights: [
      { title: "Shared inbox", body: "Assign, tag and resolve conversations as a team." },
      { title: "Templates", body: "Approved templates for confirmations, reminders and follow-ups." },
      { title: "Missed-call text-back", body: "Automatically text callers you could not answer." },
      { title: "Bulk campaigns", body: "Send personalised messages to a segment with opt-out handling." },
    ],
    stat: { value: "98%", label: "SMS open rate" },
  },
  {
    slug: "global-numbers",
    name: "Global Numbers",
    group: "Calling",
    icon: Globe2,
    short: "Local, mobile and toll-free numbers in 140+ countries.",
    headline: "A local presence in every market you sell to",
    intro:
      "Buy local, mobile and toll-free numbers instantly or port your existing ones. Customers call a familiar number, you answer from anywhere.",
    highlights: [
      { title: "Instant provisioning", body: "Most numbers are live seconds after purchase." },
      { title: "Free number porting", body: "Bring your existing numbers with no downtime." },
      { title: "Regulatory help", body: "We handle the local documentation requirements for you." },
      { title: "Number pools", body: "Rotate outbound caller IDs to keep reputation healthy." },
    ],
    stat: { value: "140+", label: "countries covered" },
  },
  {
    slug: "ai-coaching",
    name: "AI Coaching",
    group: "AI",
    icon: Sparkles,
    short: "Automatic scorecards and coaching tips after every call.",
    headline: "Coach every rep on every call, automatically",
    intro:
      "Define what a great call looks like and AI scores every conversation against it, highlighting the moments that matter for one-to-ones.",
    highlights: [
      { title: "Custom scorecards", body: "Score greeting, discovery, objection handling and close." },
      { title: "Moment highlights", body: "Jump straight to the part of the call that needs attention." },
      { title: "Trend tracking", body: "See whether coaching actually moves the numbers over time." },
      { title: "Live whisper & barge", body: "Managers can listen, whisper advice or join the call." },
    ],
    stat: { value: "+18%", label: "QA score in the first quarter" },
  },
];

export const featureGroups: FeatureGroup[] = ["Calling", "Routing", "Insights", "AI"];

export function getFeature(slug: string) {
  return features.find((f) => f.slug === slug);
}
