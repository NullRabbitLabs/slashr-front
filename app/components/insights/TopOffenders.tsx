import { Link } from 'react-router';
import type { InsightOffender } from '@/types/api';
import { NETWORK_META } from '@/lib/constants';
import { truncateMiddle, formatUsd, formatCompact } from '@/lib/format';
import { useIsMobile } from '@/hooks/useIsMobile';

interface TopOffendersProps {
  offenders: InsightOffender[];
}

export function TopOffenders({ offenders }: TopOffendersProps) {
  const isMobile = useIsMobile();

  if (offenders.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '20px 1fr auto' : '24px 44px 1fr 80px 100px',
          gap: 8,
          padding: '6px 0',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          color: 'var(--color-text-ghost)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        <span>#</span>
        {!isMobile && <span>net</span>}
        <span>validator</span>
        {!isMobile && <span style={{ textAlign: 'right' }}>events</span>}
        <span style={{ textAlign: 'right' }}>loss</span>
      </div>

      {/* Rows */}
      {offenders.map((o, i) => {
        const meta = NETWORK_META[o.network];
        const name = o.moniker || truncateMiddle(o.address, isMobile ? 16 : 24);

        return (
          <Link
            key={`${o.network}-${o.address}`}
            to={`/validator/${o.network}/${o.address}`}
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '20px 1fr auto' : '24px 44px 1fr 80px 100px',
              gap: 8,
              padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              textDecoration: 'none',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ color: 'var(--color-text-ghost)' }}>{i + 1}</span>

            {!isMobile && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    background: meta?.color ?? '#888',
                  }}
                />
                {meta?.ticker ?? o.network}
              </span>
            )}

            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'var(--color-text-primary)',
              }}
            >
              {isMobile && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    background: meta?.color ?? '#888',
                    marginRight: 6,
                    verticalAlign: 'middle',
                  }}
                />
              )}
              {name}
            </span>

            {!isMobile && (
              <span style={{ textAlign: 'right', color: 'var(--color-text-dim)' }}>
                {formatCompact(o.event_count)}
              </span>
            )}

            <span style={{ textAlign: 'right', color: '#FF4545' }}>
              {formatUsd(o.total_loss_usd)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
