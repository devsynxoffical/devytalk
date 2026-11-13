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
`kind: "callback"` (the hero "Get a call from Devy" form) requires `phone`; it is stored as a lead until telephony is connected in phase 3.
It validates with the shared Zod schema (`src/lib/lead-schema.ts`), rate-limits per IP, rejects honeypot submissions and appends each lead to `LEADS_DIR/leads.ndjson`.

## Dashboard (`/dashboard`)

The customer dashboard for the DevyTalk calling engine (repository `aicallingagent`).
It adds no data of its own: every number is read from the engine's API.

| Screen | What it shows |
| --- | --- |
| Campaigns | Every campaign with status, budget use and the reason for an automatic pause |
| Performance | Calls, answered, conversions, conversion rate, cost per conversion, budget spent and remaining, objections ranked with handled rate, lost reasons, competitors, results by playbook version and by language |
| Leads | Score and hot/warm/cold category, buying intent, status, recommended next action; filters for all of these; a detail panel with the evidence behind each score factor, quotes, objections, lost reason and call transcripts |
| Coach & playbook | Run the AI coach, read each recommendation with its evidence, compare a version with the live one, approve, reject or roll back |
| A/B tests | Start a controlled test of a version against the live one, watch sample sizes per side, stop it, or make the tested version live once the evidence supports it |

Rules the dashboard keeps:

- **Sign-in** uses the engine's API token (`API_TOKEN`, or the `api_token` file in its
  data folder). The server checks it against the engine and stores it in an httpOnly,
  SameSite=Strict cookie. Page scripts never see it, and no provider key is ever sent
  to the browser.
- **One way to the engine**: `/api/backend/*`, a server-side proxy that adds the token,
  reaches only the engine's `/api/*`, and refuses changes started by other sites.
- **Every response is validated** (`src/lib/api/schemas.ts`) before a page uses it. A
  missing value is shown as a dash or an empty state, never as zero.
- **Nothing is published automatically.** A draft goes live only after two deliberate
  clicks; a draft with unanswered blocking questions cannot be approved; a tested
  version can be made live only when the engine's verdict is "variant ahead".
- There are no personal accounts yet: everyone with the token is the same operator.

Configuration: `DEVYTALK_API_URL` (default `http://localhost:8000`), server-side only.

### Tests

```bash
npm test                                                   # unit tests (vitest)
ENGINE_DIR=/path/to/aicallingagent npm run test:e2e        # browser tests against a real engine
```

The browser tests start the engine on a new, empty SQLite database filled with the
engine's test fixtures (`tests/seed_dashboard.py`), build and start the dashboard, and
walk the whole path in Chromium: sign in, read a campaign's performance, filter and
inspect leads, reject, approve and roll back playbook versions, run and promote an A/B
test, empty states and error states. They change data, so never point them at a real
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
