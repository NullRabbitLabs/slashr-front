// Shared logic for the machine-readable incident feeds (RSS + JSON Feed),
// ported from the old Cloudflare Pages Function functions/feed/_incidents.ts.
// Event codes are NEVER shown raw (repo rule).
//
// This module is PURE and has no aliased imports, so `node --test` can load it
// without a bundler. The fetch lives in feedIncidents.server.ts.

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
  jito_opted_out: 'Stopped running Jito-Solana. Delegators no longer earn MEV tips.',
  jito_opted_in: 'Opted back into Jito-Solana. Delegators earn MEV tips again.',
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

/// How far back a feed request reaches. The feed used to be "the last 50 events"
/// with no time floor; at ~24 default-visible events/day that covered barely two
/// days, so anyone polling daily or weekly saw an arbitrary slice and silently
/// missed the rest. A time floor is what makes the feed safe to read on a
/// human's schedule rather than a poller's.
export const FEED_WINDOW_DAYS = 7;

/// Ceiling on rows per request. Matches the API's own `limit` cap.
export const FEED_MAX_ITEMS = 200;

/// Reuse terms, stated in the feed itself. A curator deciding whether they may
/// excerpt us should not have to go looking for the answer.
export const FEED_RIGHTS =
  'Free to quote and excerpt with attribution and a link to slashr.dev.';

export interface FeedWindow {
  from: string;
  limit: number;
}

/// Pure: the window a feed request should ask the API for.
export function feedWindow(now: Date): FeedWindow {
  const from = new Date(now.getTime() - FEED_WINDOW_DAYS * 86_400_000);
  return { from: from.toISOString(), limit: FEED_MAX_ITEMS };
}

export interface ApiEvent {
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

/// A feed variant: its identity, and the API query that fills it.
///
/// The query lives here rather than in the route so a feed's title and its
/// contents cannot drift apart. Renaming the feed without changing what it asks
/// for is the failure mode this prevents.
export interface FeedMeta {
  base: string;
  title: string;
  homeUrl: string;
  rssUrl: string;
  atomUrl: string;
  jsonUrl: string;
  description: string;
  /// Extra query string appended to the events request. Empty = everything.
  query: string;
}

/// The firehose. High volume, ~175 items/week, mostly Solana downtime.
export const INCIDENTS_FEED: FeedMeta = {
  base: BASE,
  title: 'Slashr · validator incidents',
  homeUrl: `${BASE}/feed`,
  rssUrl: `${BASE}/feed/incidents.rss`,
  atomUrl: `${BASE}/feed/incidents.atom`,
  jsonUrl: `${BASE}/feed/incidents.json`,
  description:
    'Live validator slashing, downtime, and commission incidents across every network we track.',
  query: '',
};

/// The curated feed: real penalties only.
///
/// Defined as `slashing=true` + `class=operational`, which the API resolves
/// against `networks.slashes_principal` (migration 076). That means the chains
/// whose protocol actually reduces stake — Ethereum, Cosmos, Celestia,
/// Polkadot — and only their fault events, never their commission changes.
///
/// Two definitions were tried and rejected against live data before this one:
///   * `category=equivocation` (double-signing) produced ZERO events in 90
///     days. Correct, unimpeachable, and a permanently empty feed.
///   * `class=operational` alone is ~78% Solana delinquency, which is the
///     noise this feed exists to escape.
/// This definition runs at roughly 15 items/week, all of them real penalties.
///
/// Calling it "slashing" is accurate here precisely BECAUSE of the
/// slashes_principal filter: every chain that can appear in it does slash.
/// Solana, Sui, Avalanche and Near cannot appear, so the feed never applies
/// the word to a chain that has no such mechanism.
export const SLASHING_FEED: FeedMeta = {
  base: BASE,
  title: 'Slashr · slashing events',
  homeUrl: `${BASE}/feed`,
  rssUrl: `${BASE}/feed/slashing.rss`,
  atomUrl: `${BASE}/feed/slashing.atom`,
  jsonUrl: `${BASE}/feed/slashing.json`,
  description:
    'Validator slashing on the chains whose protocol reduces stake: Ethereum, Cosmos, Celestia and Polkadot. Roughly 15 items a week, no downtime noise.',
  query: 'slashing=true&class=operational',
};

/// Back-compat alias for the firehose.
export const FEED_META = INCIDENTS_FEED;

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
  // Zero is not a measurement. Most Cosmos-family jailings carry no measurable
  // loss, and the live feed rendered those as "~$0 estimated loss", which reads
  // as a broken number rather than an absent one. Say nothing instead.
  if (e.penalty_amount != null && e.penalty_amount > 0 && e.penalty_token) {
    d += ` Lost ${e.penalty_amount} ${e.penalty_token}.`;
  }
  // Guard on the ROUNDED figure, not the raw one: a 40-cent loss is > 0 but
  // still prints as "~$0", which was the original complaint.
  if (e.estimated_loss_usd != null && Math.round(e.estimated_loss_usd) >= 1) {
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
      // Anchored at the event, so a reader arriving from the feed lands on the
      // thing the item is about rather than the top of a validator page.
      // (An /incident/:slug permalink would be better still, but incidents key
      // on a burst, not on individual penalty_events, so there is no mapping to
      // follow yet. See the WS-C note in plans/BLOCKTHREAT-FEEDS-PLAN.md.)
      url: `${BASE}/validator/${encodeURIComponent(e.network)}/${encodeURIComponent(e.validator_address)}#event-${e.id}`,
      network: e.network,
      networkName,
      severity: e.severity,
      eventType: e.event_type,
      description: describe(e),
      startedAt: e.started_at,
    };
  });
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

/// The newest valid `startedAt` in the set, or '' when there is none.
/// Both renderers date their document from this rather than from the request
/// clock, so a poll that changes nothing looks unchanged to the client.
function newestStartedAt(items: FeedItem[]): string {
  return items.reduce<string>((acc, it) => {
    if (!rfc822(it.startedAt)) return acc;
    return !acc || new Date(it.startedAt) > new Date(acc) ? it.startedAt : acc;
  }, '');
}

// Pure: render an RSS 2.0 document from feed items. `nowUtc` is the fallback
// build date, used only when the feed is empty: dating the channel by the newest
// item instead of the request clock is what lets a conditional GET short-circuit
// (otherwise every poll looks like a change).
export function renderRss(
  items: FeedItem[],
  nowUtc: string,
  meta: FeedMeta = INCIDENTS_FEED,
): string {
  const buildDate = newestStartedAt(items) ? rfc822(newestStartedAt(items)) : nowUtc;
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(meta.title)}</title>`,
    `    <link>${meta.homeUrl}</link>`,
    `    <atom:link href="${meta.rssUrl}" rel="self" type="application/rss+xml" />`,
    `    <description>${escapeXml(meta.description)}</description>`,
    '    <language>en</language>',
    `    <lastBuildDate>${buildDate}</lastBuildDate>`,
    `    <copyright>${escapeXml(FEED_RIGHTS)}</copyright>`,
    `    <docs>${FEED_META.homeUrl}</docs>`,
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

/// Pure: render an Atom 1.0 document. `nowUtc` is an ISO-8601 fallback, used
/// only when the feed is empty.
///
/// Atom exists alongside RSS because some readers and aggregators only accept
/// it, and because its per-entry <updated> is better defined than RSS's
/// pubDate. Same items, same rights, different envelope.
export function renderAtom(
  items: FeedItem[],
  nowUtc: string,
  meta: FeedMeta = INCIDENTS_FEED,
): string {
  const newest = newestStartedAt(items);
  const updated = newest || nowUtc;
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <title>${escapeXml(meta.title)}</title>`,
    `  <subtitle>${escapeXml(meta.description)}</subtitle>`,
    `  <link href="${meta.homeUrl}"/>`,
    `  <link href="${meta.atomUrl}" rel="self"/>`,
    `  <id>${meta.atomUrl}</id>`,
    `  <updated>${updated}</updated>`,
    `  <rights>${escapeXml(FEED_RIGHTS)}</rights>`,
  ];
  for (const it of items) {
    lines.push(
      '  <entry>',
      `    <title>${escapeXml(it.title)}</title>`,
      `    <link href="${escapeXml(it.url)}"/>`,
      `    <id>${it.id}</id>`,
      `    <updated>${it.startedAt}</updated>`,
      `    <published>${it.startedAt}</published>`,
      `    <summary>${escapeXml(it.description)}</summary>`,
      `    <category term="${escapeXml(it.networkName)}"/>`,
      `    <category term="${escapeXml(it.severity)}"/>`,
      `    <category term="${escapeXml(it.eventType)}"/>`,
      '  </entry>',
    );
  }
  lines.push('</feed>');
  return lines.join('\n');
}

// Pure: render a JSON Feed 1.1 object from feed items.
export function renderJsonFeed(
  items: FeedItem[],
  meta: FeedMeta = INCIDENTS_FEED,
): unknown {
  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: meta.title,
    home_page_url: meta.homeUrl,
    feed_url: meta.jsonUrl,
    description: meta.description,
    // JSON Feed has no rights field; user_comment is where a human-readable
    // note belongs, and the reuse terms are the note that matters here.
    user_comment: FEED_RIGHTS,
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
