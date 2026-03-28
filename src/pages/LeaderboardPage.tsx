import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { NetworkSlug, LeaderboardPeriod, LeaderboardSort } from '@/types/api';
import { NETWORK_META, NETWORK_ORDER } from '@/lib/constants';
import { truncateMiddle } from '@/lib/format';
import { relativeTime } from '@/lib/time';
import { NetworkTag } from '@/components/NetworkTag';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useIsMobile } from '@/hooks/useIsMobile';

const PERIODS: LeaderboardPeriod[] = ['7d', '30d', '90d', 'all'];

function isNetworkSlug(s: string): s is NetworkSlug {
  return (NETWORK_ORDER as readonly string[]).includes(s);
}

function isPeriod(s: string): s is LeaderboardPeriod {
  return (PERIODS as string[]).includes(s);
}

export default function LeaderboardPage() {
  const isMobile = useIsMobile();
  const [params, setParams] = useSearchParams();

  const rawNetwork = params.get('network') ?? 'solana';
  const network: NetworkSlug = isNetworkSlug(rawNetwork) ? rawNetwork : 'solana';

  const rawPeriod = params.get('period') ?? '30d';
  const period: LeaderboardPeriod = isPeriod(rawPeriod) ? rawPeriod : '30d';

  const [sort, setSort] = useState<LeaderboardSort>('worst');

  const { data, loading, error } = useLeaderboard(network, period, sort);

  const validators = useMemo(() => data?.validators ?? [], [data]);

  function updateParam(key: string, value: string) {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      next.set(key, value);
      return next;
    }, { replace: true });
  }

  return (
    <div style={{ marginTop: 8 }}>
      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        {/* Network selector - single select pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {NETWORK_ORDER.map(slug => {
            const meta = NETWORK_META[slug];
            const active = slug === network;
            return (
              <button
                key={slug}
                onClick={() => updateParam('network', slug)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 9px 3px 7px',
                  borderRadius: 3,
                  background: active ? `${meta.color}15` : 'var(--color-bg-hover)',
                  color: active ? meta.color : 'var(--color-text-dim)',
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  border: `1px solid ${active ? `${meta.color}20` : 'var(--color-border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: active ? 1 : 0.5,
                }}
              >
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: active ? meta.color : 'var(--color-text-dim)',
                    transition: 'background 0.15s ease',
                  }}
                />
                {meta.ticker}
              </button>
            );
          })}
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 0, borderRadius: 3, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          {PERIODS.map(p => {
            const active = p === period;
            return (
              <button
                key={p}
                onClick={() => updateParam('period', p)}
                style={{
                  padding: '3px 10px',
                  background: active ? 'var(--color-bg-surface)' : 'transparent',
                  color: active ? 'var(--color-text-primary)' : 'var(--color-text-dim)',
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: active ? 600 : 400,
                  border: 'none',
                  borderRight: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Sort toggle */}
        <button
          onClick={() => setSort(s => s === 'worst' ? 'best' : 'worst')}
          style={{
            padding: '3px 10px',
            background: 'transparent',
            color: 'var(--color-text-tertiary)',
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            border: '1px solid var(--color-border)',
            borderRadius: 3,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {sort === 'worst' ? '\u2193 worst first' : '\u2191 best first'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ color: 'var(--color-text-dim)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
          loading...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ color: 'var(--color-text-dim)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
          having trouble reaching the api &mdash; retrying
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border-medium)', textAlign: 'left' }}>
              <th style={{ padding: '8px 0', color: 'var(--color-text-dim)', fontWeight: 400, fontSize: 11, width: 40, textAlign: 'right', paddingRight: 12 }}>#</th>
              <th style={{ padding: '8px 0', color: 'var(--color-text-dim)', fontWeight: 400, fontSize: 11 }}>Validator</th>
              <th style={{ padding: '8px 0', color: 'var(--color-text-dim)', fontWeight: 400, fontSize: 11, width: 70, textAlign: 'right' }}>Events</th>
              <th style={{ padding: '8px 0', color: 'var(--color-text-dim)', fontWeight: 400, fontSize: 11, width: 80, textAlign: 'right' }}>Score</th>
              {!isMobile && (
                <th style={{ padding: '8px 0', color: 'var(--color-text-dim)', fontWeight: 400, fontSize: 11, width: 140, textAlign: 'right' }}>Stake</th>
              )}
            </tr>
          </thead>
          <tbody>
            {validators.map(v => {
              const scoreColor = v.severity_score >= 10
                ? 'var(--color-danger)'
                : v.severity_score >= 5
                  ? '#e8a735'
                  : 'var(--color-text-secondary)';

              const stakeDisplay = v.total_stake && v.stake_token
                ? `${Number(v.total_stake).toLocaleString()} ${v.stake_token}`
                : '\u2014';

              return (
                <tr
                  key={v.address}
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <td style={{ padding: '10px 12px 10px 0', textAlign: 'right', color: 'var(--color-text-dim)', fontSize: 12 }}>
                    {v.rank}
                  </td>
                  <td style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <NetworkTag network={network} />
                      <Link
                        to={`/validator/${network}/${v.address}`}
                        style={{ color: 'var(--color-text-primary)', fontWeight: 600, textDecoration: 'none' }}
                      >
                        {v.moniker || truncateMiddle(v.address, isMobile ? 12 : 20)}
                      </Link>
                    </div>
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                    {v.total_events}
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: scoreColor, fontWeight: 600 }}>
                    {v.severity_score}
                  </td>
                  {!isMobile && (
                    <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--color-text-dim)', fontSize: 12 }}>
                      {stakeDisplay}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Footer */}
      <div style={{ marginTop: 24, color: 'var(--color-text-dim)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
        {!loading && data && (
          <>
            {validators.length} validators
            {data.generated_at && ` \u00b7 generated ${relativeTime(data.generated_at)}`}
          </>
        )}
      </div>
    </div>
  );
}
