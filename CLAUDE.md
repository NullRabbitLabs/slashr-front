# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Slashr** (slashr.dev) is the frontend for a multi-chain validator penalty tracker (NullRabbit). It's a client-side SPA that consumes the Slashr REST API and displays a live feed of validator penalty events across Ethereum, Solana, Cosmos Hub, and Sui. Feed-first design — not a dashboard, not a SaaS product.

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

Dark theme only. No light mode toggle.

**Colours:** background `#0A0A0B`, text `#E8E6E1`, muted `rgba(255,255,255,0.4)`, hint `rgba(255,255,255,0.2)`, accent red `#FF4545`, borders `rgba(255,255,255,0.06)`. Network colours: SOL `#14F195`, ETH `#849DFF`, ATOM `#A5A7C4`, SUI `#4DA2FF`.

**Typography:** Space Grotesk 700 (headings/wordmark, -0.04em), Inter 400/500/600 (body), JetBrains Mono 400/600 (data/timestamps/tags). All via `@fontsource` npm packages, not CDN.

**Visual rules:** no purple gradients, no rounded-everything, no card-heavy layouts. Borders are 1px max. Generous vertical spacing. Resolved events at 40% opacity, unresolved at 100%.

## Animation

Events stagger in on initial load: each appears 120ms after the previous, sliding up 8px with opacity transition. This happens once on mount, not on every re-render.

## Routing

- `/` — main feed (network strip filter, event feed, load-more button)
- `/validator/:network/:address` — validator profile with event history (reached by clicking validator name in feed)

SPA routing handled by `public/_redirects` file (`/* /index.html 200`) for Cloudflare Pages.

## What NOT to Build

No auth UI, no admin panel, no settings page, no charts/graphs, no notifications, no search box (network filter strip is the only filter), no skeleton loaders (stagger animation is the loading state), no error toasts (single muted line: "having trouble reaching the api — retrying").
