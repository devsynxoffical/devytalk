# Application redesign

Scope: the application (the console at `/dashboard` and its sign-in). The marketing
site keeps its own design. No engine API contract, authentication rule or business
logic changed; three things the engine already supported gained a screen.

## 1. Inventory: what existed

| Route | What it was | Problems found |
| --- | --- | --- |
| `/login` | A card on the marketing page, inside the site header and footer | Read as part of the website, not the product |
| `/dashboard` | Stat cards, a chart, lists | Every block a rounded white card; one template for everything |
| `/dashboard/campaigns` | A grid of cards | Cannot be sorted or scanned; wastes space with three campaigns, unusable with fifty |
| `/dashboard/campaigns/[name]` | Stat cards and tables | Same card treatment for figures, tables and alerts |
| `…/leads` | Filter card, table, side panel | Table squeezed on phones; filters and results had equal weight |
| `…/playbook` | A stack of cards | Decision to make and history looked the same |
| `…/experiments` | Two cards side by side | Fine in substance, same card look |
| `/dashboard/system` | Stat cards and a table | Same |

Supported by the engine but with **no screen**: the per-campaign call log and call
detail (transcript, review, tool actions), starting and pausing a campaign, dialing
one number, editing calling rules, exporting results.

Shared problems: one typeface inherited from the marketing site; pills for every
state; rounded corners everywhere; a sidebar that disappeared on phones behind a menu
button; tables that scrolled sideways on phones; spinners instead of placeholders.

## 2. Direction: "Ledger"

The product is a record of calls and money and a place to make a few careful
decisions. The design treats it as a ledger and a console, not a showcase.

- **Paper and ink.** A warm off-white canvas (`#f6f5f1`), white working surfaces,
  near-black text. One dark element: the navigation rail in deep green-black. One loud
  colour, a signal lime, used only for "live" and the active marker.
- **Hairlines, not boxes.** Structure comes from 1px rules and alignment. A panel is
  used only where content needs its own surface. Headline figures sit in one divided
  strip, read across like a ledger line, instead of a grid of cards.
- **Crisp corners.** 2px chips, 5px controls, 8px panels, 12px overlays. Nothing pill
  shaped except meters.
- **States are a small square and a word.** Not a coloured pill. Colour never carries
  meaning alone.
- **Figures are set apart.** Counts, money, durations and phone numbers use IBM Plex
  Mono with tabular digits, so columns align and numbers are found at a glance.
- **Primary actions are ink black.** Green is kept for positive data and links, so a
  button never competes with a result.

## 3. Type

IBM Plex Sans for text, IBM Plex Mono for figures. Chosen because it is engineered,
slightly technical and has real tabular figures, and because it is not the default of
dashboard templates.

| Role | Size / line | Weight | Use |
| --- | --- | --- | --- |
| `t-title` | 20 / 26 | 600 | Page and drawer titles. Operational screens do not need bigger |
| `t-section` | 15 / 20 | 600 | Panel and section headings |
| body | 14 / 20 | 400 | Running text |
| `t-dense` | 13 / 18 | 400 | Tables, lists, form help |
| `t-meta` | 12 / 16 | 400 | Secondary detail |
| `t-eyebrow` | 11 / 16, +0.07em, caps | 600 | Labels above figures and groups |
| `t-metric` | 26 / 30, tabular | 500 | Headline figures |
| `t-figure` | inherits size | 400–500 | Any number inside text or tables (mono) |

Inputs are 16px on phones so the browser does not zoom on focus.

## 4. Tokens

All in `apps/web/src/app/globals.css` under `@theme`, used through utilities
(`bg-paper`, `text-fg-2`, `border-line`, `rounded-panel`, `shadow-overlay`).

| Group | Tokens |
| --- | --- |
| Surfaces | `paper`, `surface`, `sunken` |
| Lines | `line`, `line-strong` |
| Text | `fg`, `fg-2`, `fg-3` |
| Rail | `rail`, `rail-2`, `rail-fg`, `signal` |
| Accent | `accent`, `accent-strong` |
| Semantic | `pos`, `warn`, `crit`, `info`, each with a `-bg` tint |
| Radius | `chip` 2, `control` 5, `panel` 8, `overlay` 12 |
| Shadow | `raised`, `overlay`. Panels have none |
| Motion | `rise`, `pop`, `slide-in`, `sheet-up`, `fade`, `sheen`, `draw`, `live` |
| Data marks | `SERIES` (green, blue, orange) and `STATUS` in `components/dashboard/viz.tsx` |

Spacing uses the 4px scale; page gutters are 16px on phones and 24px from 640px.
Breakpoints: 640 (table instead of records), 768 (rail instead of tab bar), 1024 (rail
labels, two-pane call workspace), 1280 (metric strip in one row, two-column pages).

## 5. Components

`apps/web/src/components/dashboard/ui.tsx`:

| Component | Notes |
| --- | --- |
| `Button` | primary (ink), secondary (outlined), ghost, danger; two sizes; busy state; 40px tall on phones |
| `Status`, `Tag` | Square marker plus word; compact label |
| `Panel`, `PageHeader` | The only surface; header with title, description and actions |
| `MetricStrip`, `Metric` | Figures in one divided band; two columns below 1280px |
| `DataTable` | Sortable columns, announced sort order; below 640px either labelled records or a purpose-built `mobileRow` |
| `Field`, `Input`, `Select`, `Textarea`, `Segmented` | One control style, visible focus ring, inline errors |
| `Banner` | Inline message in a semantic tint with an icon |
| `NoticeBar` | Toast for the result of an action; errors stay until dismissed |
| `Confirm` | In-place confirmation: what will happen, confirm, cancel |
| `Drawer` | Side panel on wide screens, bottom sheet on phones; Escape and backdrop close; focus returns |
| `Loading`, `Skeleton` | Placeholders shaped like the content |
| `ErrorState`, `EmptyState` | Message, cause, and a way forward |
| `Meter`, `Ring`, `BarRow`, `AreaChart` | Data marks; one hue per measure; hover value on the chart |

Shell (`Shell.tsx`): navigation rail with a live campaign list, breadcrumbs, command
palette on Ctrl/⌘K (campaigns and their sections), attention menu, account menu.

## 6. A layout per job

| Screen | Layout |
| --- | --- |
| Overview | Briefing: metric strip, activity chart beside the attention queue, campaigns as a sortable table |
| Campaigns | Data grid with name filter and state filter |
| Campaign | Workspace header (state, start/pause, sections) over the section's own layout |
| Performance | Analytics: strip, objections table beside budget, three comparisons, group tables |
| Leads | Scanning: filter bar, dense grid, profile in a drawer |
| Calls | Master and detail: call log beside the selected call's summary, assessment and transcript |
| Coach & playbook | Review: drafts to decide on the left, live version and history on the right |
| A/B tests | Comparison: the two versions side by side in one panel |
| Settings | Form: labelled groups down the page, sticky save bar |
| Background work | Strip and a filtered table |
| Sign in | Split: product statement, form |

## 7. Phones and tablets

- Below 768px the rail is replaced by a four-item tab bar that respects the home
  indicator; the account menu is a sheet.
- Tablets get an icon-only rail.
- Tables become records or compact rows; nothing scrolls sideways (asserted by a
  browser test at 375px on every section, and checked at 320, 390, 768, 1024, 1280,
  1440 and 1920).
- Drawers become bottom sheets; the campaign sections scroll horizontally; the save
  bar in Settings stays above the tab bar; a back chevron replaces breadcrumbs.

## 8. Motion

Short and functional: content rises 6px on navigation (220ms), menus pop (140ms),
drawers slide, sheets rise, the chart line draws once, live states pulse. All of it is
disabled by `prefers-reduced-motion`.

## 9. New screens on existing engine functions

| Screen | Engine endpoints |
| --- | --- |
| Calls | `GET /api/campaigns/{name}/calls`, `GET /api/calls/{id}`, `POST /api/campaigns/{name}/dial` |
| Start / Pause dialing | `POST /api/campaigns/{name}/start`, `/pause` |
| Settings | `GET` and `PUT /api/campaigns/{name}/rules`, `GET …/export.csv` |

Each action that places calls asks for confirmation and shows the engine's own answer.

## 10. Not done

- No dark theme.
- Document upload, training and knowledge search still have no screen.
- No user accounts or roles, so there is no team or permission screen to design.
- The call workspace shows finished and in-progress calls from the log; it does not
  stream a live transcript, because the engine does not expose one.
