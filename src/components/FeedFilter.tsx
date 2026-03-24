import type { NetworkSlug } from '@/types/api';
import { NETWORK_META, NETWORK_ORDER } from '@/lib/constants';

interface FeedFilterProps {
  activeNetworks: Set<NetworkSlug>;
  onToggleNetwork: (slug: NetworkSlug) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function FeedFilter({ activeNetworks, onToggleNetwork, searchQuery, onSearchChange }: FeedFilterProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      {/* Network toggle pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {NETWORK_ORDER.map(slug => {
          const meta = NETWORK_META[slug];
          const active = activeNetworks.has(slug);
          return (
            <button
              key={slug}
              onClick={() => onToggleNetwork(slug)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 9px 3px 7px',
                borderRadius: 3,
                background: active ? `${meta.color}15` : 'rgba(255,255,255,0.03)',
                color: active ? meta.color : 'rgba(255,255,255,0.25)',
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                letterSpacing: '0.03em',
                border: `1px solid ${active ? `${meta.color}20` : 'rgba(255,255,255,0.06)'}`,
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
                  background: active ? meta.color : 'rgba(255,255,255,0.25)',
                  transition: 'background 0.15s ease',
                }}
              />
              {meta.ticker}
            </button>
          );
        })}
      </div>

      {/* Search input */}
      <input
        type="text"
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="address or name..."
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 4,
          color: '#E8E6E1',
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}
