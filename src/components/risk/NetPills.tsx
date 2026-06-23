import { useNetworks } from '@/hooks/useNetworks';
import { netTicker } from '@/lib/risk';

interface NetPillsProps {
  value: string; // 'all' | network slug
  onChange: (value: string) => void;
}

/** Network filter pills: "All networks" + one per enabled network. */
export function NetPills({ value, onChange }: NetPillsProps) {
  const { networks } = useNetworks();
  const pills = [{ key: 'all', label: 'All networks' }].concat(
    networks.map(n => ({ key: n.slug, label: netTicker(n.slug) })),
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
      {pills.map(p => {
        const active = value === p.key;
        return (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '7px 12px',
              borderRadius: 8,
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              background: active ? 'var(--accent-soft)' : 'var(--surface)',
              color: active ? 'var(--accent)' : 'var(--text-2)',
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
