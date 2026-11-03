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

The home page follows a proven SaaS telephony structure: gradient hero card with a working "AI agent calls you" form,
logo marquee, an interactive country / human-vs-AI agent panel with stat cards, an AI use-case selector,
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
