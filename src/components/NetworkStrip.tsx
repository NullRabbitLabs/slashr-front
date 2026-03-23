import type { NetworkSlug, NetworkInfo, StatsResponse } from '@/types/api';
import { NETWORK_META } from '@/lib/constants';

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
        background: active ? color : 'rgba(255,255,255,0.15)',
        boxShadow: active ? `0 0 6px ${color}` : 'none',
        transition: 'all 0.4s',
        flexShrink: 0,
      }}
    />
  );
}

export function NetworkStrip({ activeNetwork, onFilterChange, stats, networks }: NetworkStripProps) {
  if (networks.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 2, marginBottom: 32, flexWrap: 'wrap' }}>
      {networks.map((net, i) => {
        const slug = net.slug;
        const meta = NETWORK_META[slug];
        if (!meta) return null;
        const active = !activeNetwork || activeNetwork === slug;
        const isFirst = i === 0;
        const isLast = i === networks.length - 1;
        const networkStats = stats?.networks.find(n => n.slug === slug);

        return (
          <button
            key={slug}
            onClick={() => onFilterChange(activeNetwork === slug ? null : slug)}
            style={{
              flex: 1,
              minWidth: 120,
              background: active ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)',
              border: '1px solid',
              borderColor: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
              borderRadius: isFirst
                ? '8px 0 0 8px'
                : isLast
                  ? '0 8px 8px 0'
                  : 0,
              padding: '12px 14px',
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
                color: 'rgba(255,255,255,0.3)',
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
