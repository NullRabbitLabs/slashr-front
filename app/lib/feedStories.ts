// The story feed (WS-C): one item per incident EPISODE.
//
// The event feeds are one item per validator per event, which means a
// correlated 40-validator outage arrives as forty items. This feed is the same
// outage as one story, linking to its permalink, carrying its scale and its
// outcome.
//
// It is quiet by design. The incident layer confirms roughly two episodes a
// month (see the WS-C diagnosis in plans/BLOCKTHREAT-FEEDS-PLAN.md), so this is
// not a feed anyone should subscribe to for volume. It is the feed that is
// correct when something actually happens.
//
// Pure, no aliased imports, so `node --test` can load it without a bundler.

import type { FeedItem, FeedMeta } from './feedIncidents';

const BASE = 'https://slashr.dev';

export const STORIES_FEED: FeedMeta = {
  base: BASE,
  title: 'Slashr · incidents',
  homeUrl: `${BASE}/feed`,
  rssUrl: `${BASE}/feed/stories.rss`,
  atomUrl: `${BASE}/feed/stories.atom`,
  jsonUrl: `${BASE}/feed/stories.json`,
  description:
    'Confirmed multi-validator incidents: correlated outages, slashing cascades and exit waves, one item per episode rather than one per validator.',
  query: '',
};

/// Detector kinds are internal codes and are never rendered raw, the same rule
/// event_type follows on the incident feeds. Mirrors IncidentPage's map.
const KIND_LABELS: Record<string, string> = {
  mass_down_burst: 'Correlated outage',
  slash_burst: 'Slashing cascade',
  mass_outage: 'Correlated outage',
  exit_wave: 'Exit wave',
  commission_cluster: 'Coordinated commission move',
  whale_down: 'Large validator offline',
  real_slash: 'Slashing',
  volume_anomaly: 'Unusual activity',
};

const CHAIN_NAMES: Record<string, string> = {
  solana: 'Solana',
  ethereum: 'Ethereum',
  cosmos: 'Cosmos Hub',
  sui: 'Sui',
  polkadot: 'Polkadot',
  celestia: 'Celestia',
  avalanche: 'Avalanche',
  near: 'Near',
};

export interface ApiIncident {
  slug: string;
  kind: string;
  chain: string | null;
  status: string;
  started_at: string;
  resolved_at: string | null;
  duration_seconds: number | null;
  current_magnitude: number;
  peak_magnitude: number;
}

function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? 'Incident';
}

function chainLabel(chain: string | null): string {
  if (!chain) return 'Multi-chain';
  return CHAIN_NAMES[chain] ?? chain;
}

/// Human duration from a span the API already measured. We never recompute it
/// from the clock: a duration must run to the OBSERVED end of the incident, not
/// to the moment our sweep noticed it had ended.
function humanDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function describe(i: ApiIncident): string {
  const peak = Math.round(i.peak_magnitude);
  const scale = peak > 0 ? `${peak} validators at peak. ` : '';

  if (i.status === 'retracted') {
    return `${scale}The signal cleared before we could confirm a sustained incident. Treat the original alert as unconfirmed.`;
  }
  if (i.status === 'active' || !i.resolved_at) {
    return `${scale}Ongoing. This story updates as it develops.`;
  }
  const dur =
    i.duration_seconds != null ? ` Lasted ${humanDuration(i.duration_seconds)}.` : '';
  return `${scale}Resolved.${dur}`;
}

/// Pure: map API incidents to feed items. One item per episode.
export function mapIncidents(incidents: ApiIncident[]): FeedItem[] {
  return incidents.map((i) => {
    const chain = chainLabel(i.chain);
    return {
      id: `slashr-incident-${i.slug}`,
      title: `${chain} · ${kindLabel(i.kind)}`,
      url: `${BASE}/incident/${encodeURIComponent(i.slug)}`,
      network: i.chain ?? 'multi',
      networkName: chain,
      // An episode is by construction more serious than a single event.
      severity: i.status === 'retracted' ? 'info' : 'critical',
      eventType: i.kind,
      description: describe(i),
      startedAt: i.started_at,
    };
  });
}
