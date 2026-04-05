# slashr

Live multi-chain validator penalty tracker. Every time a validator goes offline, gets slashed, or misbehaves — it shows up here.

**[slashr.dev](https://slashr.dev)**

## What is this

Blockchains are kept running by validators — machines that verify transactions and put up money as a guarantee they'll behave. When they don't, they get penalised. Sometimes a slap on the wrist. Sometimes they lose everything.

Slashr tracks these penalty events in real-time across:

- **Solana** — delinquency (missed votes)
- **Ethereum** — slashing, inactivity leaks
- **Cosmos Hub** — double-sign slashing, downtime jailing
- **Sui** — tallying penalties

The audience is delegators, researchers, and anyone watching validator behaviour.

## Stack

React 19 + TypeScript + Vite. Deploys to Cloudflare Pages. No SSR — this is a static client-side SPA.

Dependencies are minimal by design: no state management library, no CSS-in-JS, no component library. Just React, React Router, and three fonts.

## Getting started

```bash
npm install
```

Create a `.env` file:

```
VITE_API_URL=http://localhost:3000   # API base URL
VITE_USE_MOCK=true                   # use embedded mock data instead of real API
```

```bash
npm run dev      # dev server
npm run build    # production build (zero TS errors required)
npm run preview  # preview production build
```

## Project structure

```
src/
  api/          client.ts (fetch wrapper), mock.ts (embedded mock data)
  components/   UI components (EventRow, NetworkStrip, TabBar, etc.)
  hooks/        data fetching hooks (useEvents, useLeaderboard, etc.)
  pages/        route-level pages (FeedPage, LeaderboardPage, etc.)
  lib/          constants, formatters, time utilities
  styles/       global.css (CSS variables, dark/light theme)
  types/        TypeScript types matching API response shapes
```

## Pages

| Route | What it shows |
|-------|---------------|
| `/` | Live feed of validator penalty events |
| `/validators` | Paginated validator directory |
| `/leaderboard` | Worst-performing validators ranked by severity |
| `/reports` | Provider reliability reports |
| `/check` | Paste a wallet address to check your validators |
| `/validator/:network/:address` | Individual validator profile + event history |
| `/developers` | MCP integration docs and API key request |

## MCP Server

Slashr exposes validator incident data to AI agents via the [Model Context Protocol](https://modelcontextprotocol.io). Published on the MCP Registry as [`dev.slashr/mcp`](https://registry.modelcontextprotocol.io).

**Endpoint:** `https://mcp.slashr.dev/mcp`
**Transport:** Streamable HTTP
**Auth:** Bearer token

### Connect your agent

```json
{
  "mcpServers": {
    "slashr": {
      "url": "https://mcp.slashr.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

### Get an API key

[Request access](https://github.com/NullRabbitLabs/slashr-front/issues/new?template=mcp-key-request.md) — open an issue with your project name and we'll DM you a key.

### Tools

| Tool | Description |
|------|-------------|
| `get_validator_incidents` | Incident history for a validator (delinquency, slashing, jailing) |
| `get_validator_stats` | Chain-specific performance data (stake, commission, epoch credits) |
| `get_scan_results` | Infrastructure scan: port states, CVEs, health verdict |
| `get_worst_offenders` | Validators ranked by incident severity |
| `check_delegation` | Health check on a wallet's staked positions |
| `get_network_summary` | Aggregate incident stats for a chain |

Chains: `sol`, `eth`, `sui`, `atom`. Auto-detected from address format when omitted.

See [slashr.dev/developers](https://slashr.dev/developers) for full docs.

## REST API

The frontend consumes the Slashr REST API. All responses use `{"data": ...}` envelope with optional cursor pagination. Set `VITE_USE_MOCK=true` to run without a backend.

## Design

Dark theme by default, light theme available. Monospace-accented, feed-first. Not a dashboard.

- **Headings:** Space Grotesk 700
- **Body:** Inter 400/500/600
- **Data/tags:** JetBrains Mono 400/600

---

Built by [NullRabbit](https://nullrabbit.ai)
