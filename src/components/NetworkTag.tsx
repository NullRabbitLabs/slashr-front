import type { NetworkSlug } from '@/types/api';
import { NETWORK_META } from '@/lib/constants';

interface NetworkTagProps {
  network: NetworkSlug;
}

export function NetworkTag({ network }: NetworkTagProps) {
  const meta = NETWORK_META[network];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '1px 7px 1px 5px',
        borderRadius: 3,
        background: `${meta.color}15`,
        color: meta.color,
        fontSize: 11,
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        fontWeight: 600,
        letterSpacing: '0.03em',
        lineHeight: '18px',
        flexShrink: 0,
        border: `1px solid ${meta.color}20`,
      }}
    >
      <span
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: meta.color,
          flexShrink: 0,
        }}
      />
      {meta.ticker}
    </span>
  );
}
