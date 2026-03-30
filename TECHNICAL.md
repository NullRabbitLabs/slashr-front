# Technical Documentation

## Architecture

Slashr is a client-side SPA built with React 19 + TypeScript + Vite. It deploys to Cloudflare Pages as static files with serverless functions for API proxying.

There is no SSR, no server-side state, and no build-time data fetching. The app loads, fetches data from the API, and renders. Mock mode (`VITE_USE_MOCK=true`) embeds synthetic data so the frontend runs without a backend.

Dependencies are deliberately minimal: React, React Router, and three `@fontsource` packages. No state management library, no CSS-in-JS, no component library.

## Data Flow

```
Browser
  └─ React SPA (Vite bundle)
       ├─ src/api/client.ts    ← fetch wrapper
       │    ├─ checks VITE_USE_MOCK → returns mock data
       │    └─ fetches BASE_URL/v1/* → returns API response
       ├─ src/hooks/use*.ts    ← data fetching hooks (useState + useEffect)
       └─ src/components/*.tsx ← render
```

### API Client (`src/api/client.ts`)

All API calls go through typed fetch functions. Each returns `DataResponse<T>` (`{ data: T }`) or `PaginatedResponse<T>` (`{ data: T[], pagination: { limit, has_more, next_cursor } }`).

When `VITE_USE_MOCK=true`, the client returns embedded mock data from `src/api/mock.ts` instead of making network requests.

### Polling

The live feed (`useEvents` hook) polls `GET /v1/events?limit=50` every 30 seconds. Polling pauses when the tab is hidden (`document.visibilitychange`). New events are detected by comparing IDs and prepended with a stagger animation.

### Pagination

- **Feed/Validators**: cursor-based (`next_cursor` from API, `IntersectionObserver` sentinel)
- **Rankings/Reports**: page-based (`page`/`per_page` params, `IntersectionObserver` sentinel)

## Routing

| Route | Component | Notes |
|-------|-----------|-------|
| `/` | `FeedPage` | Live event feed with polling |
| `/validators` | `ValidatorsPage` | Paginated validator directory |
| `/rankings` | `LeaderboardPage` | Worst Offenders / Most Reliable |
| `/leaderboard` | Redirect | Redirects to `/rankings` |
| `/reports` | `ReportsPage` | Provider reliability reports |
| `/reports/:providerSlug` | `ReportDetailPage` | Single provider report |
| `/check` | `CheckPage` | Wallet delegation checker |
| `/validator/:network/:address` | `ValidatorPage` | Validator profile + event history |

SPA routing handled by `public/_redirects` (`/* /index.html 200`) for Cloudflare Pages.

## Component Tree

```
App
  └─ Layout                    ← top bar, shared header, footer
       ├─ NetworkStrip         ← network cards (horizontal scroll on mobile)
       ├─ Explainer            ← collapsible "what am I looking at?"
       ├─ TabBar               ← desktop: horizontal tabs / mobile: dropdown menu
       └─ {page content}
            ├─ FeedPage
            │    ├─ FeedFilter ← network pills + search input
            │    ├─ EventFeed  ← polling container
            │    │    └─ EventRow × N
            │    └─ load more sentinel
            ├─ ValidatorsPage  ← table with infinite scroll
            ├─ LeaderboardPage ← ranked table with infinite scroll
            ├─ ReportsPage     ← provider list with search/letter filter
            ├─ CheckPage       ← wallet input + delegation cards
            └─ ValidatorProfile
                 ├─ Sparkline
                 ├─ ChainDataSections
                 └─ Event history (grouped by title)
```

### Key Components

| Component | Role |
|-----------|------|
| `Layout` | Top bar (brand, live dot, theme toggle), shared header, attribution |
| `TabBar` | Desktop: horizontal tab links. Mobile: dropdown trigger + overlay menu |
| `EventRow` | Single feed item: timestamp, network tag, severity, validator name, event label |
| `NetworkStrip` | Network summary cards. Desktop: flex row. Mobile: horizontal scroll strip |
| `FeedFilter` | Network toggle pills + search input for feed/validators |
| `ValidatorProfile` | Full validator detail page with enrichment data, event history, infrastructure |
| `NetworkTag` | Colored pill with dot + network ticker |
| `SeverityMark` | Red "SLASHED" monospace label for critical events |
| `WaitlistDrawer` | Fixed-position modal (bottom sheet on mobile, centered on desktop) |

## Hooks

| Hook | What it does |
|------|-------------|
| `useEvents` | Fetch + poll events with cursor pagination, stagger animation |
| `useNetworks` | Fetch enabled networks list |
| `useStats` | Fetch aggregate stats (24h/7d/30d/all-time counts) |
| `useLeaderboard` | Paginated leaderboard fetch with page/per_page |
| `useReportProviders` | Paginated provider list with search/letter filtering |
| `useReport` | Fetch single provider report |
| `useValidator` | Fetch validator profile + event history |
| `useChainData` | Fetch chain-specific validator data |
| `useDelegations` | Wallet delegation lookup |
| `useIsMobile` | Media query hook for `(max-width: 640px)` |
| `useTheme` | Dark/light theme toggle (persisted to localStorage) |
| `useDebouncedValue` | Debounce a value by N milliseconds |

## Styling

All component styles are inline (`React.CSSProperties`) with conditional values based on `useIsMobile()`. No CSS-in-JS library.

### Theme System

CSS custom properties defined in `src/styles/global.css` under `:root` (dark) and `[data-theme="light"]`. Components reference these via `var(--color-*)`.

Key variables:
- `--color-bg` / `--color-bg-card` / `--color-bg-surface` / `--color-bg-hover` — backgrounds
- `--color-text-primary` through `--color-text-ghost` — text hierarchy
- `--color-border` / `--color-border-medium` / `--color-border-strong` — borders
- `--color-accent` / `--color-danger` — green accent, red danger

### Typography

- **Space Grotesk 700**: headings, wordmark (`-0.04em` letter-spacing)
- **Inter 400/500/600**: body text
- **JetBrains Mono 400/600**: data, timestamps, tags, monospace UI

All loaded via `@fontsource` npm packages (no CDN).

### Mobile Breakpoint

`640px` via `useIsMobile()` hook. Components conditionally render different layouts:
- `TabBar`: dropdown menu instead of horizontal tabs
- `NetworkStrip`: horizontal scroll strip instead of flex row
- `EventRow`: stacked name/title, hidden timestamp, wider address truncation
- `ValidatorProfile`: 2-column grid instead of flex wrap

## Cloudflare Functions

The `functions/` directory contains Cloudflare Pages Functions (serverless):

| File | Purpose |
|------|---------|
| `functions/_middleware.ts` | CF Access JWT validation for `/api/*` routes |
| `functions/api/[[path]].ts` | Proxy `/api/v1/*` requests to the backend API |
| `functions/api/waitlist.ts` | Waitlist signup endpoint |

## Event Type Translation

Raw `event_type` values from the API are never shown to users. The mapping in `src/lib/constants.ts`:

| event_type | Display text |
|------------|-------------|
| `delinquent` | "Went dark. Missed votes." |
| `slashed` | "Double-signed a block. Slashed." |
| `inactivity_leak` | "Missed attestations during finality delay." |
| `slashed_double_sign` | "Signed conflicting blocks at the same height. Tombstoned." |
| `slashed_downtime` | "Offline too long. Jailed." |
| `tallying_penalty` | "Scored low by peer validators." |
| `duplicate_block` | "Produced duplicate blocks in the same slot." |
| `dot_slashed` | "Slashed on Polkadot." |
| `dot_not_elected` | "Not elected to active validator set." |

When `penalty_amount` and `penalty_token` are set, "Lost {amount} {token}." is appended.

## Build & Deploy

### Local Development

```bash
npm install
cp .env.example .env  # or create manually
npm run dev            # Vite dev server on localhost:5173
```

### Production Build

```bash
npm run build          # tsc + vite build (zero TS errors required)
npm run preview        # preview production build locally
```

### CI/CD

GitHub Actions (`.github/workflows/deploy.yml`):
1. `test` job: checkout, npm ci, `tsc --noEmit`, `npm run build` (with mock data)
2. `deploy` job (push to main only): build with `VITE_API_URL=/api`, deploy via `wrangler pages deploy`

Runs on `ubuntu-latest`. Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `""` (empty) | API base URL. `/api` in production (proxied by CF Functions) |
| `VITE_USE_MOCK` | `"false"` | Use embedded mock data instead of real API |
