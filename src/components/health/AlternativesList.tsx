import { Link } from 'react-router-dom';
import type { HealthAlternative, NetworkSlug } from '@/types/api';
import { GradeBadge } from './GradeBadge';

interface Props {
  alternatives: HealthAlternative[];
  network: NetworkSlug;
}

export function AlternativesList({ alternatives, network }: Props) {
  if (alternatives.length === 0) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--color-text-dim)',
          marginBottom: 8,
        }}
      >
        Consider switching to
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alternatives.map(alt => (
          <Link
            key={alt.address}
            to={`/validator/${network}/${encodeURIComponent(alt.address)}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              background: 'var(--color-bg-surface, var(--color-bg))',
              border: '1px solid var(--color-border)',
              borderRadius: 3,
              textDecoration: 'none',
              fontSize: 12,
              fontFamily: "'Inter', sans-serif",
              color: 'var(--color-text-secondary)',
              transition: 'border-color 0.15s ease',
            }}
          >
            <GradeBadge grade={alt.grade} size="sm" />
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {alt.name ?? alt.address.slice(0, 12) + '...'}
            </span>
            {alt.commission != null && (
              <span style={{ color: 'var(--color-text-dim)' }}>
                {(alt.commission * 100).toFixed(0)}% commission
              </span>
            )}
            <span style={{ color: 'var(--color-text-dim)' }}>
              {alt.incident_count_90d} incidents
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
