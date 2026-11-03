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

### Theme

Deep ink navy (`ink-*`), teal brand (`brand-*`) and amber accent (`accent-*`), defined as Tailwind tokens in `apps/web/src/app/globals.css`. Change the palette there and the whole site follows.

### Content

All copy lives in `apps/web/src/content/*.ts` (features, solutions, pricing, integrations, numbers, blog, FAQ, navigation). Pages render from that data, so adding a feature or blog post means adding one object.

> Customer names, testimonials, stats and legal text are **placeholders**. Replace them with real, approved content before going live.

### Lead API

`POST /api/leads` accepts `{ kind: "demo" | "trial" | "contact" | "newsletter", email, name?, company?, phone?, teamSize?, message? }`.
It validates with the shared Zod schema (`src/lib/lead-schema.ts`), rate-limits per IP, rejects honeypot submissions and appends each lead to `LEADS_DIR/leads.ndjson`.

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
