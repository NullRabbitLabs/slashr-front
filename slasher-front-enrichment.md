# Slasher-Front — Enrichment & Polkadot Changes

## Context

The slasher-worker backend now writes enrichment data to validators: `stake`, `stake_token`, `commission_pct`, `node_ip`, `hosting_provider`, `website`, `has_contact`, `in_scan_db`. The API returns these fields on the validator profile endpoint. Polkadot has also been added as a 5th network. The frontend needs to be updated to display this data and support the new network.

## Current frontend state

- React 19 + TypeScript + Vite, all inline styles, no CSS framework
- Types in `src/types/api.ts`, API calls in `src/api/client.ts`, mock data in `src/api/mock.ts`
- Constants (network colors, event labels) in `src/lib/constants.ts`
- Color palette: bg `#0A0A0B`, text `#E8E6E1`, muted `rgba(255,255,255,0.4)`
- Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (data/labels)
- Two routes: `/` (FeedPage) and `/validator/:network/:address` (ValidatorPage)

## Changes needed

### 1. Add Polkadot as a 5th network

**`src/types/api.ts`**:
- Add `'polkadot'` to the `NetworkSlug` union type
- Add `'dot_slashed'` and `'dot_not_elected'` to the `EventType` union type

**`src/lib/constants.ts`**:
- Add Polkadot to `NETWORK_META`:
  - ticker: `"DOT"`
  - color: `"#E6007A"` (Polkadot pink)
  - label: `"Polkadot"`
- Add event type labels:
  - `dot_slashed`: `"Slashed on-chain. Stake reduced."`
  - `dot_not_elected`: `"Dropped from active validator set."`

**`src/components/NetworkStrip.tsx`**:
- Add Polkadot as a 5th button in the strip (currently hardcoded to 4 networks)
- If the network list is hardcoded, add `'polkadot'` to it
- If it reads from the API `networks` response, it should work automatically

**`src/api/mock.ts`**:
- Add a Polkadot network entry to `MOCK_NETWORKS`
- Add sample Polkadot events (dot_slashed, dot_not_elected) to `MOCK_EVENTS`
- Add Polkadot stats to `MOCK_STATS`

### 2. Extend ValidatorProfile type with enrichment fields

**`src/types/api.ts`** — add to `ValidatorProfile`:
```typescript
interface ValidatorProfile {
  // existing fields...
  address: string;
  moniker: string | null;
  network: NetworkSlug;
  first_seen: string;
  last_seen: string;
  metadata: Record<string, unknown>;
  events: ValidatorEventItem[];
  // NEW enrichment fields:
  stake: number | null;
  stake_token: string | null;
  commission_pct: number | null;
  node_ip: string | null;
  hosting_provider: string | null;
  website: string | null;
  has_contact: boolean;
  in_scan_db: boolean;
}
```

Note: `contact_email` is NEVER exposed by the API. Do not add it.

### 3. Display enrichment data on ValidatorPage

**`src/pages/ValidatorPage.tsx`** — add an enrichment info section between the validator header and the event history. Display:

- **Stake**: `{stake} {stake_token}` (e.g., "114,405 SOL"). Format with commas. Show only if `stake` is not null.
- **Commission**: `{commission_pct}%` (e.g., "5%"). Show only if not null.
- **Node IP**: `{node_ip}` in monospace. Show only if not null.
- **Hosting**: `{hosting_provider}` (e.g., "OVH SAS"). Show only if not null.
- **Website**: clickable link to `{website}`. Show only if not null.
- **Scan status**: If `in_scan_db` is true, show a small indicator/badge "In scan DB". If false, omit.

**Layout**: Use a grid or flex row of key-value pairs, styled like metadata. Use JetBrains Mono for values, Inter for labels. Keep it compact — this is supplementary info, not the main content. Muted label color (`rgba(255,255,255,0.4)`), brighter value color (`#E8E6E1`).

Only render the enrichment section if at least one enrichment field is non-null. If a validator has no enrichment data at all, don't show an empty section.

### 4. Update mock validator data

**`src/api/mock.ts`** — update `buildMockValidator()` and/or the mock events to include enrichment fields on the validator profile:
```typescript
stake: 114405.43,
stake_token: "SOL",
commission_pct: 5,
node_ip: "64.34.94.207",
hosting_provider: "OVH SAS",
website: "https://example.com",
has_contact: true,
in_scan_db: false,
```

### 5. No other API changes needed

The backend now only returns `published = true` events. This is transparent to the frontend — same endpoint, same response shape, just filtered server-side. No frontend changes needed for the publish gate.

## Style guidelines

- All styling is inline via React `style` prop — do NOT introduce CSS modules, Tailwind, or styled-components
- Follow the existing color palette and font choices exactly
- Keep the dark theme aesthetic consistent
- New sections should animate in like existing content (opacity transitions)
- Do not add unnecessary dependencies

## Verification

1. `npm run build` passes with no TypeScript errors
2. With `VITE_USE_MOCK=true`, the feed shows Polkadot events with correct pink color
3. With `VITE_USE_MOCK=true`, clicking a validator shows the enrichment info section
4. The enrichment section doesn't render for validators with no enrichment data
5. The Polkadot network button appears in the NetworkStrip and filters correctly
