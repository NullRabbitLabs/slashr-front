// Shared logic for the machine-readable incident feeds (RSS + JSON Feed).
// Underscore-prefixed → not a route; imported by incidents.rss.ts / incidents.json.ts.
//
// Event codes are NEVER shown raw (repo rule). EVENT_LABELS / EVENT_SHORT mirror
// slasher-front/src/lib/constants.ts (EVENT_TYPE_LABELS + FeedPage's short map) —
// keep them in sync. Kept self-contained (not imported from src) to match the
// other Pages Functions and avoid `@/`-alias resolution in the functions bundler.

export interface Env {
  API_ORIGIN: string;
  CF_ACCESS_CLIENT_ID: string;
  CF_ACCESS_CLIENT_SECRET: string;
  API_JWT_TOKEN?: string;
}

const BASE = 'https://slashr.dev';

const NETWORK_NAMES: Record<string, string> = {
  solana: 'Solana',
  ethereum: 'Ethereum',
  cosmos: 'Cosmos Hub',
  sui: 'Sui',
  polkadot: 'Polkadot',
  celestia: 'Celestia',
  avalanche: 'Avalanche',
  near: 'Near',
};

const EVENT_LABELS: Record<string, string> = {
  delinquent: 'Went dark. Missed votes.',
  slashed: 'Double-signed a block. Slashed.',
  inactivity_leak: 'Missed attestations during finality delay.',
  slashed_double_sign: 'Signed conflicting blocks at the same height. Tombstoned.',
  slashed_downtime: 'Offline too long. Jailed.',
  tallying_penalty: 'Flagged by peers. Epoch rewards forfeited.',
  duplicate_block: 'Produced duplicate blocks in the same slot.',
  dot_slashed: 'Slashed on-chain. Stake reduced.',
  dot_not_elected: 'Dropped from active validator set.',
  commission_increase: 'Raised commission. Delegators earn less.',
  vanilla_solana: 'Running vanilla Solana. MEV tips forfeited.',
  jito_opted_out: 'Stopped running Jito-Solana — delegators no longer earn MEV tips.',
  jito_opted_in: 'Opted back into Jito-Solana — delegators earn MEV tips again.',
  tia_slashed_downtime: 'Offline too long on Celestia. Jailed.',
  tia_slashed_double_sign: 'Signed conflicting blocks at the same height on Celestia. Tombstoned.',
  avax_uptime_below_threshold: 'Uptime fell below the Avalanche reward threshold. Stakers earn nothing this period.',
  near_kicked_out: 'Kicked from the Near validator set. Delegators earn nothing this epoch.',
};

const EVENT_SHORT: Record<string, string> = {
  delinquent: 'Downtime',
  slashed: 'Slashing',
  slashed_double_sign: 'Slashing',
  slashed_downtime: 'Slashing',
  dot_slashed: 'Slashing',
  tia_slashed_downtime: 'Slashing',
  tia_slashed_double_sign: 'Slashing',
  inactivity_leak: 'Inactivity',
  duplicate_block: 'Duplicate block',
  tallying_penalty: 'Tallying penalty',
  commission_increase: 'Commission change',
  vanilla_solana: 'MEV forfeited',
  jito_opted_out: 'MEV disabled',
  jito_opted_in: 'MEV re-enabled',
  dot_not_elected: 'Not elected',
  avax_uptime_below_threshold: 'Uptime below threshold',
  near_kicked_out: 'Ejected from set',
};

interface ApiEvent {
  id: number;
  network: string;
  validator_address: string;
  validator_moniker: string | null;
  event_type: string;
  severity: string;
  started_at: string;
  resolved_at: string | null;
  penalty_amount: number | null;
  penalty_token: string | null;
  estimated_loss_usd: number | null;
}

export interface FeedItem {
  id: string;
  title: string;
  url: string;
  network: string;
  networkName: string;
  severity: string;
  eventType: string;
  description: string;
  startedAt: string;
}

export const FEED_META = {
  base: BASE,
  title: 'Slashr — validator incidents',
  homeUrl: `${BASE}/feed`,
  rssUrl: `${BASE}/feed/incidents.rss`,
  jsonUrl: `${BASE}/feed/incidents.json`,
  description:
    'Live validator slashing, downtime, and commission incidents across Solana, Ethereum, Sui, and Cosmos.',
};

function shortAddr(a: string): string {
  return a.length <= 16 ? a : `${a.slice(0, 8)}…${a.slice(-4)}`;
}

function titleCase(code: string): string {
  return code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function withThousands(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function describe(e: ApiEvent): string {
  let d = EVENT_LABELS[e.event_type] ?? titleCase(e.event_type);
  if (e.penalty_amount != null && e.penalty_token) {
    d += ` Lost ${e.penalty_amount} ${e.penalty_token}.`;
  }
  if (e.estimated_loss_usd != null) {
    d += ` ~$${withThousands(e.estimated_loss_usd)} estimated loss.`;
  }
  d += e.resolved_at ? ' (Resolved.)' : ' (Ongoing.)';
  return d;
}

// Pure: map raw API events → normalized feed items. No I/O (unit-testable).
export function mapEvents(events: ApiEvent[]): FeedItem[] {
  return events.map((e) => {
    const name = e.validator_moniker?.trim() || shortAddr(e.validator_address);
    const networkName = NETWORK_NAMES[e.network] ?? e.network;
    const short = EVENT_SHORT[e.event_type] ?? titleCase(e.event_type);
    return {
      id: `slashr-event-${e.id}`,
      title: `${name} · ${networkName} · ${short}`,
      url: `${BASE}/validator/${encodeURIComponent(e.network)}/${encodeURIComponent(e.validator_address)}`,
      network: e.network,
      networkName,
      severity: e.severity,
      eventType: e.event_type,
      description: describe(e),
      startedAt: e.started_at,
    };
  });
}

export async function fetchFeedItems(env: Env, limit = 50): Promise<FeedItem[]> {
  const url = `${env.API_ORIGIN}/v1/events?limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID,
      'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET,
      Accept: 'application/json',
      ...(env.API_JWT_TOKEN ? { Authorization: `Bearer ${env.API_JWT_TOKEN}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`events fetch failed: ${res.status}`);
  const json = (await res.json()) as { data: ApiEvent[] };
  return mapEvents(json.data);
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function rfc822(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toUTCString();
}

// Pure: render an RSS 2.0 document from feed items. `nowUtc` = channel build date.
export function renderRss(items: FeedItem[], nowUtc: string): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(FEED_META.title)}</title>`,
    `    <link>${FEED_META.homeUrl}</link>`,
    `    <atom:link href="${FEED_META.rssUrl}" rel="self" type="application/rss+xml" />`,
    `    <description>${escapeXml(FEED_META.description)}</description>`,
    '    <language>en</language>',
    `    <lastBuildDate>${nowUtc}</lastBuildDate>`,
    '    <ttl>60</ttl>',
  ];
  for (const it of items) {
    lines.push(
      '    <item>',
      `      <title>${escapeXml(it.title)}</title>`,
      `      <link>${it.url}</link>`,
      `      <guid isPermaLink="false">${it.id}</guid>`,
      `      <pubDate>${rfc822(it.startedAt)}</pubDate>`,
      `      <category>${escapeXml(it.networkName)}</category>`,
      `      <category>${escapeXml(it.severity)}</category>`,
      `      <description>${escapeXml(it.description)}</description>`,
      '    </item>',
    );
  }
  lines.push('  </channel>', '</rss>');
  return lines.join('\n');
}

// Pure: render a JSON Feed 1.1 object from feed items.
export function renderJsonFeed(items: FeedItem[]): unknown {
  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: FEED_META.title,
    home_page_url: FEED_META.homeUrl,
    feed_url: FEED_META.jsonUrl,
    description: FEED_META.description,
    items: items.map((it) => ({
      id: it.id,
      url: it.url,
      title: it.title,
      content_text: it.description,
      date_published: it.startedAt,
      tags: [it.networkName, it.severity, it.eventType],
    })),
  };
}
