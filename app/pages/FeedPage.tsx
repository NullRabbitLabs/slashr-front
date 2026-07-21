import { useState } from 'react';
import type { EventListItem, EventType } from '@/types/api';
import { useEvents } from '@/hooks/useEvents';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useJsonLd } from '@/hooks/useJsonLd';
import { NetPills } from '@/components/risk/NetPills';
import { EVENT_TYPE_LABELS } from '@/lib/constants';
import { netColor, netTicker } from '@/lib/risk';
import { formatStakeCompact, formatUsd } from '@/lib/format';
import { formatUtcTime, relativeTime } from '@/lib/time';

const EVENT_SHORT: Partial<Record<EventType, string>> = {
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
  voluntary_exit: 'Voluntary exit',
};

const FEED_DATASET = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'Slashr validator incident feed',
  description:
    'A live feed of validator slashing, downtime, and commission events across every network we track.',
  url: 'https://slashr.dev/feed',
  keywords: ['validator slashing incidents', 'validator downtime', 'slashing events', 'staking incidents'],
  isAccessibleForFree: true,
  creator: { '@type': 'Organization', name: 'NullRabbit', url: 'https://nullrabbit.ai' },
};

function shortType(t: string): string {
  return EVENT_SHORT[t as EventType] ?? t.replace(/_/g, ' ');
}

function eventColor(e: EventListItem): string {
  if (e.event_type === 'jito_opted_in') return 'var(--ok)';
  if (e.severity === 'critical') return 'var(--crit)';
  if (e.severity === 'warning') return 'var(--warn)';
  return 'var(--text-3)';
}

interface Impact {
  label: string;
  value: string;
  color: string;
}

function impactOf(e: EventListItem): Impact {
  if (e.estimated_loss_usd != null) {
    return { label: 'Lost', value: formatUsd(e.estimated_loss_usd), color: 'var(--crit)' };
  }
  if (e.loss_per_hour_usd != null) {
    return { label: 'Rate', value: `${formatUsd(e.loss_per_hour_usd)}/hr`, color: 'var(--text)' };
  }
  return { label: 'Impact', value: e.resolved_at ? 'Resolved' : 'Ongoing', color: 'var(--text)' };
}

interface FeedPageProps {
  initialData?: { events: EventListItem[]; hasMore: boolean; cursor: string | null } | null;
}

export default function FeedPage({ initialData }: FeedPageProps = {}) {
  const [net, setNet] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const { events, loading, error, hasMore, loadMore, loadingMore } = useEvents({
    network: net === 'all' ? null : net,
    search: '',
    showAll,
    initialData,
  });

  usePageMeta({
    title: 'Live Validator Incident Feed · Slashing & Downtime',
    description:
      'Every validator slashing, downtime, and commission event across every network we track, as it happens.',
  });
  useJsonLd(FEED_DATASET);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)', margin: '0 0 4px' }}>Live incident feed</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
          Every downtime, slashing, and commission event as it happens. Your staking rewards depend on validators staying
          online. Here’s every time one didn’t.
        </p>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <NetPills value={net} onChange={setNet} />
        <button
          onClick={() => setShowAll(v => !v)}
          aria-pressed={showAll}
          title="Reveal high-volume, low-signal events (exits, MEV opt in/out) that are hidden from the default feed"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '6px 11px', borderRadius: 8,
            background: showAll ? 'var(--surface-2)' : 'var(--surface)',
            border: `1px solid ${showAll ? 'var(--text-3)' : 'var(--border)'}`,
            color: showAll ? 'var(--text)' : 'var(--text-3)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap', transition: 'all .15s ease',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 13, height: 13, borderRadius: 3, flex: 'none',
              border: `1.5px solid ${showAll ? 'var(--text)' : 'var(--text-3)'}`,
              background: showAll ? 'var(--text)' : 'transparent',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--surface)', fontSize: 10, lineHeight: 1,
            }}
          >
            {showAll ? '✓' : ''}
          </span>
          Show all events
        </button>
      </div>

      {loading && <div style={{ padding: 30, color: 'var(--text-3)', fontSize: 13 }}>Loading feed…</div>}
      {error && <div style={{ padding: 12, color: 'var(--text-3)', fontSize: 13 }}>Having trouble reaching the API. Retrying.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {events.map(e => {
          const color = eventColor(e);
          const impact = impactOf(e);
          return (
            <div
              key={e.id}
              style={{ display: 'flex', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '15px 17px', boxShadow: 'var(--shadow)' }}
            >
              <span style={{ width: 3, flex: 'none', borderRadius: 3, background: color }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: netColor(e.network), background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 5 }}>{netTicker(e.network)}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color, letterSpacing: '.04em' }}>{e.resolved_at ? 'RESOLVED' : 'ONGOING'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{shortType(e.event_type)}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-3)' }}>{formatUtcTime(e.started_at)} · {relativeTime(e.started_at)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 4, flexWrap: 'wrap' }}>
                  <a href={`/validator/${e.network}/${encodeURIComponent(e.validator_address)}`} style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                    {e.validator_moniker || e.validator_address}
                  </a>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11.5, color: 'var(--text-3)' }}>{e.validator_address}</span>
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--text-2)' }}>{EVENT_TYPE_LABELS[e.event_type as EventType] ?? e.event_type}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>At risk </span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                      {e.validator_stake != null && e.validator_stake_token ? `${formatStakeCompact(e.validator_stake)} ${e.validator_stake_token}` : '-'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{impact.label} </span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: impact.color, fontVariantNumeric: 'tabular-nums' }}>{impact.value}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Commission </span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                      {e.validator_commission_pct != null ? `${e.validator_commission_pct}%` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          style={{ width: '100%', marginTop: 14, padding: 12, fontSize: 13, fontWeight: 600, color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11, cursor: 'pointer' }}
        >
          {loadingMore ? 'Loading…' : 'Load more events'}
        </button>
      )}
    </div>
  );
}
