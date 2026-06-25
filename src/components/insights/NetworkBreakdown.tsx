import { useMemo } from 'react';
import type { DailyInsight, NetworkSlug } from '@/types/api';
import { NETWORK_META, NETWORK_ORDER } from '@/lib/constants';
import { formatCompact } from '@/lib/format';

interface NetworkBreakdownProps {
  daily: DailyInsight[];
}

export function NetworkBreakdown({ daily }: NetworkBreakdownProps) {
  const segments = useMemo(() => {
    const totals: Record<string, { events: number; loss: number }> = {};
    let grandTotal = 0;

    for (const d of daily) {
      for (const n of d.by_network) {
        if (!totals[n.slug]) totals[n.slug] = { events: 0, loss: 0 };
        const t = totals[n.slug]!;
        t.events += n.event_count;
        t.loss += n.loss_usd;
        grandTotal += n.event_count;
      }
    }

    return NETWORK_ORDER
      .filter(slug => (totals[slug]?.events ?? 0) > 0)
      .map(slug => {
        const t = totals[slug]!;
        return {
          slug: slug as NetworkSlug,
          events: t.events,
          loss: t.loss,
          pct: grandTotal > 0 ? (t.events / grandTotal) * 100 : 0,
        };
      });
  }, [daily]);

  if (segments.length === 0) return null;

  return (
    <div>
      {/* Stacked bar */}
      <div
        style={{
          display: 'flex',
          height: 20,
          width: '100%',
          overflow: 'hidden',
          gap: 2,
        }}
      >
        {segments.map(seg => (
          <div
            key={seg.slug}
            style={{
              flex: seg.pct,
              background: NETWORK_META[seg.slug]?.color ?? '#888',
              opacity: 0.8,
              minWidth: seg.pct > 1 ? 4 : 2,
            }}
          />
        ))}
      </div>

      {/* Labels */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px 24px',
          marginTop: 12,
        }}
      >
        {segments.map(seg => {
          const meta = NETWORK_META[seg.slug];
          return (
            <div
              key={seg.slug}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: meta?.color ?? '#888',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 12 }}>
                {meta?.ticker ?? seg.slug}
              </span>
              <span style={{ color: 'var(--color-text-dim)', fontSize: 12 }}>
                {formatCompact(seg.events)}
              </span>
              <span style={{ color: 'var(--color-text-ghost)', fontSize: 12 }}>
                {seg.pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
