# Slashr — Frontend Prompt
## Single-session build. Vite + React + TypeScript. Deploys to Cloudflare Pages.

---

## Why Vite, Not Next.js

This is a client-side app consuming a JSON REST API. There is no server-side rendering requirement — the primary view is a live feed that is inherently client-side. Cloudflare Pages serves static sites natively. Next.js would add SSR complexity, the `@cloudflare/next-on-pages` adapter, and build-time friction for zero benefit. Vite + React builds in seconds and deploys to Cloudflare Pages with `npx wrangler pages deploy dist`.

---

## What This Is

**Slashr** (slashr.dev) is a live feed of validator penalty events across Ethereum, Solana, Cosmos Hub, and Sui. It consumes the Slashr JSON REST API (documented below). The entire frontend is one page with a feed-first design — not a dashboard, not a SaaS product. Think live wire, not admin panel.

The audience is delegators, researchers, and anyone watching validator behaviour. Many users will not know what "slashing" means. The UI must be understandable without jargon.

---

## Design Direction

**Dark, monospace-accented, feed-first.** This is a monitoring tool with editorial energy, not a crypto dashboard.

- Background: `#0A0A0B`
- Text primary: `#E8E6E1`
- Text muted: `rgba(255,255,255,0.4)`
- Text hint: `rgba(255,255,255,0.2)`
- Accent / bolt red: `#FF4545`
- Borders: `rgba(255,255,255,0.06)`
- Network colors: SOL `#14F195`, ETH `#849DFF`, ATOM `#A5A7C4`, SUI `#4DA2FF`

**Typography:**
- Wordmark / headings: `Space Grotesk` 700, tight letter-spacing (-0.04em)
- Body: `Inter` 400/500/600
- Data / timestamps / tags: `JetBrains Mono` 400/600

All three from Google Fonts. Import via `@fontsource` packages (npm), not Google Fonts CDN link tags.

**No generic AI aesthetics.** No purple gradients. No rounded-everything. No card-heavy layouts. Borders are 1px max, mostly `rgba(255,255,255,0.06)`. Generous vertical spacing. Horizontal density in data rows.

---

## Project Setup

```
slashr-web/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   └── client.ts          ← fetch wrapper, base URL from env
│   ├── components/
│   │   ├── Layout.tsx          ← top bar, hero, footer
│   │   ├── NetworkStrip.tsx    ← horizontal filter bar
│   │   ├── EventFeed.tsx       ← the live feed
│   │   ├── EventRow.tsx        ← single event in the feed
│   │   ├── ValidatorProfile.tsx ← /validator/:network/:address view
│   │   ├── StatsBar.tsx        ← aggregate counts
│   │   ├── Explainer.tsx       ← "what am i looking at?" expandable
│   │   ├── NetworkTag.tsx      ← colored pill: SOL, ETH, ATOM, SUI
│   │   ├── SeverityMark.tsx    ← "SLASHED" label for critical events
│   │   ├── LiveDot.tsx         ← pulsing green dot
│   │   └── BoltLogo.tsx        ← SVG bolt mark component
│   ├── hooks/
│   │   ├── useEvents.ts        ← fetch + poll events, cursor pagination
│   │   └── useNetworks.ts      ← fetch networks list
│   ├── types/
│   │   └── api.ts              ← TypeScript types matching API response shapes
│   └── styles/
│       └── global.css          ← CSS reset, variables, font imports
├── public/
│   ├── favicon.svg             ← bolt on dark rounded square
│   └── bolt.svg                ← standalone bolt mark
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

**Dependencies:**
- `react`, `react-dom`
- `react-router-dom` — for `/validator/:network/:address` route
- `@fontsource/space-grotesk`, `@fontsource/inter`, `@fontsource/jetbrains-mono`
- `vite`, `@vitejs/plugin-react`, `typescript`

No state management library. No CSS-in-JS library. No component library. Plain CSS + inline styles where appropriate. Keep it light.

---

## API Contract

Base URL is configured via `VITE_API_URL` environment variable. Default: `http://localhost:3000`.

### GET /v1/networks

```json
{
  "data": [
    {
      "slug": "solana",
      "name": "Solana",
      "enabled": true,
      "last_run_at": "2026-03-22T10:00:00Z",
      "last_run_status": "ok",
      "poll_interval_secs": 30
    }
  ]
}
```

### GET /v1/events

Query params: `?network=solana`, `?type=delinquent`, `?from=`, `?to=`, `?limit=50`, `?cursor=`

```json
{
  "data": [
    {
      "id": 1,
      "network": "solana",
      "validator_address": "AbC123...",
      "validator_moniker": "Everstake",
      "event_type": "delinquent",
      "severity": "warning",
      "started_at": "2026-03-22T09:00:00Z",
      "resolved_at": "2026-03-22T09:12:00Z",
      "penalty_amount": null,
      "penalty_token": null
    }
  ],
  "pagination": {
    "limit": 50,
    "has_more": true,
    "next_cursor": "eyJzIjoiMjAyNi0wMy..."
  }
}
```

### GET /v1/events/:id

Same shape as list item but includes `raw: {}` JSONB field.

### GET /v1/validators/:network/:address

```json
{
  "data": {
    "address": "AbC123...",
    "moniker": "Everstake",
    "network": "solana",
    "first_seen": "2026-01-15T08:00:00Z",
    "last_seen": "2026-03-22T10:00:00Z",
    "metadata": {},
    "events": [
      {
        "id": 42,
        "event_type": "delinquent",
        "severity": "warning",
        "started_at": "2026-03-22T09:00:00Z",
        "resolved_at": "2026-03-22T09:12:00Z",
        "penalty_amount": null,
        "penalty_token": null
      }
    ]
  }
}
```

### GET /v1/stats

```json
{
  "data": {
    "networks": [
      {
        "slug": "solana",
        "name": "Solana",
        "counts": { "last_24h": 12, "last_7d": 47, "last_30d": 189, "all_time": 1042 }
      }
    ],
    "totals": { "last_24h": 12, "last_7d": 49, "last_30d": 194, "all_time": 1065 }
  }
}
```

---

## Mock Data

Until the API is live, the app must work with embedded mock data. Create a `src/api/mock.ts` file that exports the same shapes as the API responses. The `client.ts` fetch wrapper should check for `VITE_USE_MOCK=true` and return mock data instead of fetching.

Use the following mock events (these reflect real penalty types across chains):

```typescript
const MOCK_EVENTS = [
  { id: 1, network: "solana", validator_address: "GaLaX...v3Rq", validator_moniker: "Galaxy Digital", event_type: "delinquent", severity: "warning", started_at: "2026-03-23T14:32:00Z", resolved_at: null, penalty_amount: null, penalty_token: null },
  { id: 2, network: "ethereum", validator_address: "0x8f2...4a1c", validator_moniker: null, event_type: "slashed", severity: "critical", started_at: "2026-03-23T13:44:00Z", resolved_at: "2026-03-23T13:44:00Z", penalty_amount: 1.05, penalty_token: "ETH" },
  { id: 3, network: "cosmos", validator_address: "cosmo...8qzp", validator_moniker: "Everstake", event_type: "slashed_downtime", severity: "warning", started_at: "2026-03-23T11:02:00Z", resolved_at: null, penalty_amount: 0.01, penalty_token: "ATOM" },
  { id: 4, network: "sui", validator_address: "0x2f8...e91a", validator_moniker: "Mysten Labs", event_type: "tallying_penalty", severity: "warning", started_at: "2026-03-23T10:18:00Z", resolved_at: null, penalty_amount: null, penalty_token: null },
  { id: 5, network: "solana", validator_address: "Choru...xK9m", validator_moniker: "Chorus One", event_type: "delinquent", severity: "warning", started_at: "2026-03-23T09:41:00Z", resolved_at: "2026-03-23T09:53:00Z", penalty_amount: null, penalty_token: null },
  { id: 6, network: "ethereum", validator_address: "0xa1c...77f2", validator_moniker: "Lido", event_type: "inactivity_leak", severity: "warning", started_at: "2026-03-23T08:55:00Z", resolved_at: "2026-03-23T09:20:00Z", penalty_amount: null, penalty_token: "ETH" },
  { id: 7, network: "solana", validator_address: "Figmt...pQ2r", validator_moniker: "Figment", event_type: "delinquent", severity: "warning", started_at: "2026-03-23T06:12:00Z", resolved_at: "2026-03-23T06:30:00Z", penalty_amount: null, penalty_token: null },
  { id: 8, network: "cosmos", validator_address: "cosmo...3kxr", validator_moniker: "Informal Systems", event_type: "slashed_double_sign", severity: "critical", started_at: "2026-03-23T03:30:00Z", resolved_at: "2026-03-23T03:30:00Z", penalty_amount: 487, penalty_token: "ATOM" },
];
```

---

## Plain English Translation

The frontend NEVER shows raw `event_type` values to users. Translate them:

| event_type | What the user sees |
|---|---|
| `delinquent` | "Went dark. {context from raw if available, otherwise 'missed votes'}" |
| `slashed` | "Double-signed a block. Slashed." |
| `inactivity_leak` | "Missed attestations during finality delay." |
| `slashed_double_sign` | "Signed conflicting blocks at the same height. Tombstoned." |
| `slashed_downtime` | "Offline too long. Jailed." |
| `tallying_penalty` | "Scored low by peer validators." |
| `duplicate_block` | "Produced duplicate blocks in the same slot." |

If `penalty_amount` and `penalty_token` are set, append: "Lost {amount} {token}."
If `resolved_at` is set, show "Resolved" tag.

Severity labels for users:
- `critical` → show red "SLASHED" tag in monospace caps
- `warning` → no tag (the description speaks for itself)
- `info` → no tag

---

## Page Structure

### Route: `/` (main feed)

Top to bottom:

1. **Top bar** — LiveDot + "watching {total_validators} validators" on left, "nullrabbit.ai" on right. Full width, thin bottom border.

2. **Hero** — Bolt SVG + "slashr" wordmark (Space Grotesk 48px 700, gradient text from #E8E6E1 to #FF4545). Below: one-line description in muted text. No more than two lines total.

3. **Network strip** — Four buttons in a connected row (first has left radius, last has right radius, middle have none). Each shows: colored dot + network ticker (SOL/ETH/ATOM/SUI) + incidents count. Click to filter the feed. Click again to clear. Active = brighter, inactive = dimmed. These are the ONLY filter controls — no dropdowns, no date pickers, no search box.

4. **"What am I looking at?"** — Expandable `<details>` element. Collapsed by default. Three short paragraphs explaining validators, penalties, and what this feed shows. Use the exact text from the mock — it was written for people who have never heard of proof-of-stake.

5. **Live feed header** — "LIVE FEED" in monospace uppercase, with clear-filter button when a network filter is active.

6. **Event rows** — Each row shows:
   - UTC timestamp in monospace, left-aligned, fixed width
   - Network tag (colored pill: dot + ticker)
   - "SLASHED" mark if severity is critical
   - "Resolved" tag if resolved
   - Relative time ("12m ago") right-aligned
   - Second line, indented to align with text above: **Validator name** in bold + plain English description

   Resolved events render at 40% opacity. Unresolved events at 100%.

   Events stagger in on initial load — each appears 120ms after the previous, sliding up 8px with an opacity transition. This happens once on mount, not on every re-render.

7. **Load more** — If `pagination.has_more` is true, show a "load more" button at the bottom of the feed. Style: monospace, minimal, border only. Clicking fetches the next cursor page and appends to the feed.

8. **Footer** — "polling every 30–120s" on left, "built by nullrabbit" on right. Thin top border.

### Route: `/validator/:network/:address`

Reached by clicking a validator name in the feed.

1. **Back link** — "← back to feed" in muted monospace.
2. **Validator header** — Moniker (or address if no moniker), network tag, address in monospace muted text. `first_seen` and `last_seen` dates.
3. **Event history** — Same row format as the main feed, but without network tag and validator name (redundant). Ordered by `started_at DESC`.

---

## Polling

The feed polls the API every 30 seconds when the browser tab is visible. Use `document.visibilitychange` to pause polling when the tab is hidden. On each poll:

1. Fetch `GET /v1/events?limit=50` (no cursor — always fetch the latest)
2. Compare returned event IDs against currently displayed events
3. Prepend any new events to the top of the feed with the stagger animation
4. Do not remove events that have disappeared from the API response (they scrolled past the first page)

---

## API Client

`src/api/client.ts`:

```typescript
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export async function fetchEvents(params?: { network?: string; cursor?: string; limit?: number }) {
  if (USE_MOCK) return getMockEvents(params);
  const url = new URL(`${BASE_URL}/v1/events`);
  if (params?.network) url.searchParams.set('network', params.network);
  if (params?.cursor) url.searchParams.set('cursor', params.cursor);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

Same pattern for `fetchNetworks`, `fetchValidator`, `fetchStats`. All return typed responses.

---

## Environment Variables

```
VITE_API_URL=http://localhost:3000     ← API base URL
VITE_USE_MOCK=true                      ← use embedded mock data (default true until API is live)
```

---

## Cloudflare Pages Deployment

The build output is `dist/`. Deployment:

```bash
npm run build
npx wrangler pages deploy dist --project-name=slashr
```

Add a `_redirects` file in `public/`:
```
/*  /index.html  200
```

This handles client-side routing — all paths serve `index.html` and React Router takes over.

---

## What NOT To Build

- No authentication UI
- No admin panel
- No settings page
- No dark/light mode toggle (it's dark, full stop)
- No charts, graphs, or visualisations
- No notification system
- No search box (network filter strip is the only filter mechanism)
- No skeleton loaders — just don't render until data arrives. The stagger animation IS the loading state.
- No error toasts — if the API is down, show a single muted line below the feed header: "having trouble reaching the api — retrying"

---

## Done Criteria

- [ ] `npm run build` succeeds with zero TypeScript errors
- [ ] `npm run dev` serves the app with mock data
- [ ] Main feed renders all mock events with correct plain English translations
- [ ] Network filter strip filters events by network
- [ ] Stagger animation plays on initial load
- [ ] Clicking a validator name navigates to `/validator/:network/:address`
- [ ] Validator profile page renders event history
- [ ] "What am I looking at?" expandable works and contains jargon-free explanation
- [ ] Bolt logo SVG renders in the hero
- [ ] Favicon is the bolt on dark square
- [ ] `VITE_USE_MOCK=true` serves mock data, `false` hits the real API
- [ ] `_redirects` file exists for Cloudflare Pages SPA routing
- [ ] No purple gradients, no rounded-everything, no generic dashboard aesthetic
- [ ] Zero usage of `event_type` raw values in user-visible text
- [ ] "SLASHED" label only appears on `severity: critical` events
- [ ] Resolved events at 40% opacity
