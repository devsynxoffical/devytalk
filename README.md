# DevyTalk

Cloud phone system and AI call center for sales and support teams.
This repository holds the DevyTalk product. Phase 1 (this commit) is the public marketing website with working forms.

## Phase 1: Marketing website (`apps/web`)

Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + Zod. 43 statically generated pages plus one API route.

| Route | What it does |
| --- | --- |
| `/` | Home: hero with an interactive softphone demo, features, solutions, AI section, ROI calculator, integrations, testimonials, FAQ |
| `/features`, `/features/[slug]` | Feature overview and 12 feature detail pages (dialers, IVR, routing, recording, analytics, AI…) |
| `/solutions/[slug]` | 6 solution pages (sales, support, startups, e-commerce, enterprise, healthcare) |
| `/pricing` | Monthly/annual toggle, team-size slider with live totals, comparison table, FAQ |
| `/integrations` | Searchable, filterable integration directory |
| `/numbers` | Phone number coverage and prices by country, with search and type filter |
| `/customers`, `/about`, `/blog`, `/blog/[slug]` | Company and content pages |
| `/demo`, `/signup` | Lead forms validated on client and server, stored by `POST /api/leads` |
| `/login` | Sign-in UI (auth arrives with the app backend in phase 2) |
| `/legal/privacy`, `/legal/terms` | Legal templates |

### Design

Light theme on pure white sections. Colour lives in cards, product frames and gradients:
ink navy text (`ink-*`), emerald-teal primary (`brand-*`), lime highlights (`lime-*`) and a sky gradient partner,
all defined as Tailwind tokens in `apps/web/src/app/globals.css`.

The home page opens with a light, centered hero: a rotating headline, an inline "Call me" bar that requests a call
from the AI agent, and an animated live-call scene with mouse parallax. It continues with a logo marquee,
an interactive country / human-vs-AI agent panel with count-up stats, an AI use-case selector,
two product showcases with auto-rotating tabs over HTML-built product UI, tabbed testimonials, a bento feature grid,
a live softphone demo, tabbed integrations, a compliance banner, FAQ with a contact card and a big-wordmark footer.

### Content

All copy lives in `apps/web/src/content/*.ts` (features, solutions, pricing, integrations, numbers, blog, FAQ, navigation). Pages render from that data, so adding a feature or blog post means adding one object.

> Customer names and logos (`components/brand/CustomerLogos.tsx`), testimonials, stats, compliance badges
> (`components/brand/ComplianceBadges.tsx`) and legal text are **placeholders**. Integration icons come from
> Simple Icons (CC0); the brand names and marks belong to their owners. Replace them with real, approved content before going live.

### Lead API

`POST /api/leads` accepts `{ kind: "demo" | "trial" | "contact" | "newsletter" | "callback", email, name?, company?, phone?, teamSize?, message? }`.
`kind: "callback"` (the hero "Call me" form) requires `phone`. It is a request to be called back by a person; nothing is dialed automatically.
It validates with the shared Zod schema (`src/lib/lead-schema.ts`), rate-limits per IP and rejects honeypot submissions.

Where a submission goes: with `DEVYTALK_INTAKE_TOKEN` set (the same value as `INTAKE_TOKEN` on the calling engine) it is handed to the engine and appears under **Requests** in the console. If the engine cannot take it, or no token is set, it is appended to `LEADS_DIR/leads.ndjson` on the web server and the log says so, so a visitor's request is never dropped.

## Dashboard (`/dashboard`)

The customer dashboard for the DevyTalk calling engine (repository `aicallingagent`).
It adds no data of its own: every number is read from the engine's API.

| Screen | What it shows |
| --- | --- |
| Overview | Totals across campaigns, a calls-per-day chart, what needs a decision, campaigns compared in a sortable table, call outcomes, hottest leads |
| Campaigns | Every campaign in a sortable grid with state, leads, meetings and budget use; filter by name or state |
| Campaign header | State, **Start dialing** / **Pause dialing** (confirmed, and the engine's answer shown), and the sections below |
| Performance | Calls, answered, conversions, conversion rate, cost per conversion, objections with handled rate, budget and limits, lost reasons, competitors, results by playbook version and language |
| Leads | Filters for quality, status, buying intent, score and search; a dense grid; a profile drawer with the evidence behind each score factor, quotes, objections, next action and call history |
| Calls | The call log, updating while calls are in progress; for each call the summary, follow-up, assessment, objections, what the agent did and the transcript; a form to call one number |
| Coach & playbook | Run the AI coach, read each recommendation with its evidence, compare a version with the live one, approve, reject or roll back |
| A/B tests | Start a controlled test, compare the two versions side by side with sample sizes, stop it, or make the tested version live once the evidence supports it |
| Knowledge | Upload documents or add a website, watch them being read, remove them, test what the agent would find for a prospect's question, build a draft playbook from them |
| Settings | Languages the agent opens in and switches to; the inbound number the campaign answers; calling days and hours, attempts, daily and monthly limits, budget and stop conditions; export of results as CSV |
| New campaign | A short form that creates a campaign with a working playbook, without the command line or the AI model |
| Requests | What visitors sent through the website's forms; mark as handled |
| Setup | The services a call needs, each named by what it does in a call (the phone line, the ears, the brain, the voice): which are connected, what to do about the rest, and the engine settings still missing (names only, with a button that copies the list for whoever runs the engine); the outbound number; the address to give the phone provider for inbound calls |
| Help | Step-by-step guides, the questions asked first, and what every word on the screens means, searched from one field |
| Team | Admins add people, change roles, reset passwords, deactivate and reactivate |
| Your account | Who you are signed in as; change your password |
| Background work | Reviews, booking notifications and training runs: waiting, running, gave up, with the reason and a way to run one again |

Design: `docs/UI_REDESIGN.md` describes the visual language ("Ledger"), the tokens,
the type system (IBM Plex Sans and Mono), the component library and the layout chosen
for each screen. Jump anywhere with Ctrl/⌘K. Phones get a tab bar, compact rows and
bottom sheets instead of a squeezed desktop.

Finding your way:

- **Every page is in the rail**, grouped (the work, Account, Developers, then Setup and
  Help). The account menu holds only the person's own things: theme, password, sign out.
  On a phone the three busiest pages are tabs and the rest is one tap further, under More.
- **A launch guide** on the overview shows the way to the first call (connect the
  services, create a campaign, add people, place a call) until every step is done. A
  step is done when the thing it asks for exists; nothing is remembered in the browser.
- **A check before dialing starts**: the confirmation says whether the services are
  connected, how many leads are waiting, when calls go out and what is left of the
  budget, each with the way to fix it. The engine still decides.
- **Question marks beside figures and headings** open a short explanation and lead to
  the same word in Help. One file (`src/content/console-help.ts`) feeds the hints, the
  Help page and the search; a unit test fails if a screen uses a word it does not explain.
- **Search** (Ctrl/⌘K) finds pages by what people call them ("billing" finds Usage),
  campaign sections, and the words Help explains.

Rules the dashboard keeps:

- **Sign-in** is with a personal account (email and password) or, for first setup, the
  engine's API token. Either is checked by the engine; what the browser keeps is the
  engine's session in an httpOnly, SameSite=Strict cookie. Page scripts never see it,
  signing in cannot be done through the proxy, and no provider key is ever sent to the
  browser.
- **Roles**: viewers read; operators also run campaigns; admins also decide what goes
  live, set rules and manage people. The engine enforces this on every request. The
  console only avoids offering what would be refused.
- **One way to the engine**: `/api/backend/*`, a server-side proxy that adds the token,
  reaches only the engine's `/api/*`, and refuses changes started by other sites.
- **Every response is validated** (`src/lib/api/schemas.ts`) before a page uses it. A
  missing value is shown as a dash or an empty state, never as zero.
- **Nothing is published automatically.** A draft goes live only after two deliberate
  clicks; a draft with unanswered blocking questions cannot be approved; a tested
  version can be made live only when the engine's verdict is "variant ahead".
- **Organization**: the numbers its calls go out from (assigned by the operator on the
  Organizations screen), where calls are transferred and where bookings are reported.
  The webhook's signing secret can be set and replaced, never read back.
- **API keys** for an organization's own systems: a name, a role, shown once, revocable.
- **Usage**: what the organization used, month by month, from the engine's ledger:
  calls, AI and corrections, by campaign, with every line as CSV. A month that is
  over does not change. It is a statement of usage, not a tax invoice, and says so.
  Below it, what a result cost over the last 30 days: per call, per connected call,
  per minute and per booked meeting, in total and by campaign. A cost per meeting
  that rests on fewer than five meetings is marked.
- **Per playbook version**: a campaign's performance page gives each version its
  agent quality and cost per conversion, and follows the versions week by week. A
  week with too few answered calls is shown and marked.
- **A transferred call** shows what the colleague who took over was told: the
  agent's note and the last things the person said.
- **Invitations**: on the Team screen an admin makes a one-time link for a person
  and passes it on; at `/invite/…` the person chooses their own password and is
  signed in. The same kind of link resets a forgotten password and signs the account
  out everywhere else. No email is sent. The session from a link goes into the same
  httpOnly cookie as any sign-in; a link cannot be used through the dashboard proxy.
- **Webhooks**: an admin registers addresses of the organization's own systems and
  chooses the events each receives (a call's outcome, a booked meeting, a campaign
  stopping). The signing secret is shown once; a test delivery says how it went; each
  endpoint lists what was sent to it and what it answered; a failed delivery can be
  sent again. No delivery has been made to a real receiver from this code.
- **Do not call**: the numbers an organization never calls. Add one, import a list (a
  public register, another system's suppression list), search; an admin can take a
  number off, and can erase a person on request: their details and what was said on
  their calls are removed, the number stays on the list, and recordings held at the
  phone provider are listed so they can be deleted there.
- **Consent and retention**: a campaign can be set to call only people with a ground
  for calling on record; an organization chooses how many days call content is kept.
  These are mechanisms. Whether a setting satisfies the law of a market is a legal
  question nobody has answered here (the engine's `docs/COMPLIANCE.md`).
- **Light and dark themes**, chosen in the account menu and kept in the browser.
- **A call in progress** is followed in the Calls section: the transcript fills in as
  people speak.

Configuration, all server-side only: `DEVYTALK_API_URL` (default `http://localhost:8000`);
`DEVYTALK_INTAKE_TOKEN` (website forms to the engine, see Lead API);
`TRUSTED_PROXY_HOPS` (default 1: how many proxies of your own stand in front of this
server; the sign-in and form limits count attempts per address as reported by the
outermost of them, which a visitor cannot choose. 0 when nothing stands in front:
all visitors then share one limit).

Every response carries security headers (`next.config.ts`): a content policy that
allows this origin only and refuses framing, plugins and forms posted elsewhere;
`nosniff`; a referrer policy; HSTS. The content policy allows inline scripts, which
the framework needs without per-request nonces, so it does not stop a script
injected into a page; the pages render no user-supplied HTML.

`.github/workflows/ci.yml` runs the type check, the unit tests and the build. The
browser tests are not in CI: they need the engine's repository.

### Tests

```bash
npm test                                                   # unit tests (vitest)
ENGINE_DIR=/path/to/aicallingagent npm run test:e2e        # browser tests against a real engine
```

The browser tests start the engine on a new, empty SQLite database filled with the
engine's test fixtures (`tests/seed_dashboard.py`), build and start the dashboard, and
walk the whole path in Chromium: sign in, read a campaign's performance, filter and
inspect leads, reject, approve and roll back playbook versions, run and promote an A/B
test, upload and search documents, import leads, sign in with personal accounts and
check each role, manage the team, send the website's forms and find them under
Requests, create a campaign and set its languages and inbound number, switch themes,
the rail and the phone's menu, the launch guide, the check before dialing, the hints
and Help, empty states and error states. Two things are simulated and marked as such in the
tests, because no phone provider is configured there: the engine's answers for a call
in progress, and the phone provider's request for an inbound call. They change data, so never point them at a real
database. The fixture campaigns exist only in that temporary database.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
```

Requires Node 20.9+.

## Roadmap

- **Phase 2: App backend** (`apps/api`): accounts, workspaces, users and roles, auth, billing; leads move from the NDJSON file to the database/CRM.
- **Phase 3: Calling**: telephony provider integration (numbers, inbound/outbound, recording), WebRTC softphone, queues, IVR builder, routing rules.
- **Phase 4: Insights & AI**: call logs, wallboards, transcripts, summaries, AI voice agent, CRM integrations.
