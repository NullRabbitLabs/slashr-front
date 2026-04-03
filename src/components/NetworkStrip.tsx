import type { NetworkInfo, StatsResponse } from '@/types/api';
import { NETWORK_META } from '@/lib/constants';
import { useIsMobile } from '@/hooks/useIsMobile';

interface NetworkStripProps {
  stats: StatsResponse | null;
  networks: NetworkInfo[];
}

function Pulse({ color, active }: { color: string; active: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: active ? color : 'var(--color-text-dim)',
        boxShadow: active ? `0 0 6px ${color}` : 'none',
        transition: 'all 0.4s',
        flexShrink: 0,
      }}
    />
  );
}

export function NetworkStrip({ stats, networks }: NetworkStripProps) {
  const isMobile = useIsMobile();

  if (networks.length === 0) return null;

  return (
    <div
      className={isMobile ? 'network-strip-scroll' : undefined}
      style={
        isMobile
          ? {
              display: 'flex',
              gap: 6,
              marginBottom: 16,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }
          : { display: 'flex', gap: 2, marginBottom: 32 }
      }
    >
      {networks.map((net) => {
        const slug = net.slug;
        const meta = NETWORK_META[slug];
        if (!meta) return null;
        const active = true;
        const networkStats = stats?.networks.find(n => n.slug === slug);

        return (
          <div
            key={slug}
            style={{
              flex: isMobile ? undefined : 1,
              flexShrink: isMobile ? 0 : undefined,
              background: active ? 'var(--color-bg-surface)' : 'var(--color-bg-hover)',
              border: '1px solid',
              borderColor: active ? 'var(--color-border-medium)' : 'var(--color-bg-surface)',
              borderRadius: 6,
              padding: isMobile ? '8px 12px' : '12px 14px',
              textAlign: 'left',
              transition: 'all 0.2s',
              opacity: active ? 1 : 0.4,
            }}
          >
            {isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <Pulse color={meta.color} active={active} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: active ? meta.color : 'var(--color-text-tertiary)',
                  }}
                >
                  {meta.ticker}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-tertiary)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {networkStats ? networkStats.counts.last_30d : '0'}
                </span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Pulse color={meta.color} active={active} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: active ? meta.color : 'var(--color-text-tertiary)',
                      transition: 'color 0.2s',
                    }}
                  >
                    {meta.ticker}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-tertiary)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {networkStats ? `${networkStats.counts.last_30d} incidents / 30d` : '\u00A0'}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
