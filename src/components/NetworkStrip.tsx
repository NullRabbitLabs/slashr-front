import type { NetworkSlug, NetworkInfo, StatsResponse } from '@/types/api';
import { NETWORK_META } from '@/lib/constants';
import { useIsMobile } from '@/hooks/useIsMobile';

interface NetworkStripProps {
  activeNetwork: NetworkSlug | null;
  onFilterChange: (network: NetworkSlug | null) => void;
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
        background: active ? color : 'rgba(255,255,255,0.25)',
        boxShadow: active ? `0 0 6px ${color}` : 'none',
        transition: 'all 0.4s',
        flexShrink: 0,
      }}
    />
  );
}

export function NetworkStrip({ activeNetwork, onFilterChange, stats, networks }: NetworkStripProps) {
  const isMobile = useIsMobile();

  if (networks.length === 0) return null;

  const isOddCount = networks.length % 2 !== 0;

  return (
    <div
      style={
        isMobile
          ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 24 }
          : { display: 'flex', gap: 2, marginBottom: 32 }
      }
    >
      {networks.map((net, i) => {
        const slug = net.slug;
        const meta = NETWORK_META[slug];
        if (!meta) return null;
        const active = !activeNetwork || activeNetwork === slug;
        const networkStats = stats?.networks.find(n => n.slug === slug);
        const isLast = i === networks.length - 1;

        return (
          <button
            key={slug}
            onClick={() => onFilterChange(activeNetwork === slug ? null : slug)}
            style={{
              flex: isMobile ? undefined : 1,
              gridColumn: isMobile && isLast && isOddCount ? 'span 2' : undefined,
              background: active ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)',
              border: '1px solid',
              borderColor: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
              borderRadius: 6,
              padding: isMobile ? '10px 12px' : '12px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              opacity: active ? 1 : 0.4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Pulse color={meta.color} active={active} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: active ? meta.color : 'rgba(255,255,255,0.4)',
                  transition: 'color 0.2s',
                }}
              >
                {meta.ticker}
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.45)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {networkStats ? `${networkStats.counts.last_24h} incidents / 24h` : '\u00A0'}
            </div>
          </button>
        );
      })}
    </div>
  );
}
