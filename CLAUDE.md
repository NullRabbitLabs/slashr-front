# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Slashr** (slashr.dev) is the frontend for a multi-chain validator risk-intelligence product (NullRabbit). It's a client-side SPA that consumes the Slashr REST API. As of the June 2026 redesign (reference: `~/Sync/Slashr.dc.html`) the primary nav is **Overview / Risk / Live Feed / Validators / Reports**, organised around the Slashr Risk Index. Secondary pages (Insights, Check, Leaderboard/Rankings, Alerts, Developers) remain reachable off the primary nav. (Earlier docs described this as "feed-first, not a SaaS" — superseded by the redesign.)

## Tech Stack

React + TypeScript + Vite. Deploys to Cloudflare Pages. No SSR, no Next.js — this is deliberately a static client-side app.

**Dependencies are minimal by design:** react, react-dom, react-router-dom, @fontsource/{space-grotesk,inter,jetbrains-mono}, vite, @vitejs/plugin-react, typescript. No state management library. No CSS-in-JS. No component library.

## Build & Dev Commands

```bash
npm run dev                                          # Vite dev server
npm run build                                        # production build (must have zero TS errors)
npm run preview                                      # preview production build locally
npx wrangler pages deploy dist --project-name=slashr # deploy to Cloudflare Pages
```

## Environment Variables

```
VITE_API_URL=http://localhost:3000   # API base URL
VITE_USE_MOCK=true                   # use embedded mock data instead of real API
```

## Architecture

```
src/
  main.tsx                  ← entry point
  App.tsx                   ← router setup (/ and /validator/:network/:address)
  api/
    client.ts               ← fetch wrapper, checks VITE_USE_MOCK, base URL from env
    mock.ts                 ← embedded mock data matching API response shapes
  components/
    Layout.tsx              ← top bar (LiveDot + validator count), hero, footer
    NetworkStrip.tsx        ← connected filter buttons (SOL/ETH/ATOM/SUI) with incident counts
    EventFeed.tsx           ← live feed container with polling
    EventRow.tsx            ← single event: timestamp, network tag, severity, description
    ValidatorProfile.tsx    ← /validator/:network/:address view
    StatsBar.tsx            ← aggregate counts
    Explainer.tsx           ← collapsible "what am I looking at?" <details> element
    NetworkTag.tsx          ← colored pill (dot + ticker)
    SeverityMark.tsx        ← red "SLASHED" label (critical only)
    LiveDot.tsx             ← pulsing green indicator
    BoltLogo.tsx            ← SVG bolt mark
  hooks/
    useEvents.ts            ← fetch + poll events, cursor pagination
    useNetworks.ts          ← fetch networks list
  types/
    api.ts                  ← TypeScript types matching API response shapes
  styles/
    global.css              ← CSS reset, variables, font imports
```

## Key Spec Files

- `main.md` — complete frontend requirements, API contract, component specs, design tokens, mock data
- `slasher-context.md` — backend context (schema, enums, cross-chain penalty model, NetworkCollector trait)
- `slasher-v2.jsx` — reference React mockup showing exact visual patterns and component structure

## API Contract

Base URL from `VITE_API_URL`. All responses use envelope `{"data": ...}` with optional `{"pagination": {"limit", "has_more", "next_cursor"}}`.

| Endpoint | Purpose |
|---|---|
| `GET /v1/networks` | Enabled networks with last_run_at/status |
| `GET /v1/events` | Paginated events. Filters: `?network=`, `?type=`, `?from=`, `?to=`, `?limit=`, `?cursor=` |
| `GET /v1/events/:id` | Single event including `raw` JSONB |
| `GET /v1/validators/:network/:address` | Validator profile + event history |
| `GET /v1/stats` | Counts by network for 24h/7d/30d/all-time |

## Polling Behaviour

- Poll `GET /v1/events?limit=50` every 30 seconds (no cursor — always fetch latest)
- Pause polling when tab is hidden (`document.visibilitychange`)
- Compare event IDs to detect new events; prepend new ones with stagger animation
- Never remove events that disappeared from the response (they scrolled past page 1)

## Event Type Translation

Raw `event_type` values must **never** appear in user-visible text. Use these translations:

| event_type | User sees |
|---|---|
| `delinquent` | "Went dark. {context or 'missed votes'}" |
| `slashed` | "Double-signed a block. Slashed." |
| `inactivity_leak` | "Missed attestations during finality delay." |
| `slashed_double_sign` | "Signed conflicting blocks at the same height. Tombstoned." |
| `slashed_downtime` | "Offline too long. Jailed." |
| `tallying_penalty` | "Scored low by peer validators." |
| `duplicate_block` | "Produced duplicate blocks in the same slot." |

Append "Lost {amount} {token}." when `penalty_amount` and `penalty_token` are set. Show "Resolved" tag when `resolved_at` is set.

## Severity Display

- `critical` → red "SLASHED" tag in monospace caps
- `warning` / `info` → no tag (description speaks for itself)

## Design System

**Light theme is the default**, with a dark-mode toggle (`useTheme` sets `data-theme="dark"`; light = no attribute). Both themes are first-class.

**Tokens:** the redesign uses short token names defined in `styles/global.css` — `--bg`, `--surface`, `--surface-2`, `--border`, `--text`/`--text-2`/`--text-3`, `--accent` (blue `#2f6bff` light / `#5b8cff` dark), `--crit`, `--warn`, `--ok`, `--track`, `--shadow`. Legacy `--color-*` tokens remain for secondary pages. Network colours come from `NETWORK_META` in `lib/constants.ts`. Risk-surface helpers (tier colours, sparklines, signal breakdown) live in `lib/risk.ts`.

**Typography:** Geist Sans 300–700 (redesign body + headings) and Geist Mono 400/500 (addresses/data), via `@fontsource/geist-sans` + `@fontsource/geist-mono`. Legacy faces (Space Grotesk / Inter / JetBrains Mono) are still imported for secondary pages. All via `@fontsource` npm packages, not CDN.

**Visual rules:** no purple gradients, no rounded-everything, no card-heavy layouts. Borders are 1px max. Generous vertical spacing. Resolved events at 40% opacity, unresolved at 100%.

## Animation

Events stagger in on initial load: each appears 120ms after the previous, sliding up 8px with opacity transition. This happens once on mount, not on every re-render.

## Routing

- `/` — main feed (network strip filter, event feed, load-more button)
- `/validator/:network/:address` — validator profile with event history (reached by clicking validator name in feed)

SPA routing handled by `public/_redirects` file (`/* /index.html 200`) for Cloudflare Pages.

## Auth UI

Passwordless magic-link auth exists for **account/API access** (the public data pages stay public). `/login` requests a sign-in link (Turnstile-gated), `/auth/verify` exchanges the emailed token for an opaque httpOnly session cookie, `/account` is the dashboard. State lives in `hooks/useAuth.tsx` (`AuthProvider` + `useAuth`); API calls in `api/auth.ts` use `credentials: 'include'`. The `/api` proxy (`functions/api/[[path]].ts`) forwards `Cookie`/`X-Slashr-CSRF` upstream and passes `Set-Cookie` back.

## What NOT to Build

No admin panel, no settings page, no charts/graphs, no notifications, no search box (network filter strip is the only filter), no skeleton loaders (stagger animation is the loading state), no error toasts (single muted line: "having trouble reaching the api — retrying").
