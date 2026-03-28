import { Link } from 'react-router-dom';
import { useReportProviders } from '@/hooks/useReportProviders';

export default function ReportsPage() {
  const { providers, loading, error } = useReportProviders();

  if (loading) {
    return (
      <div style={{ padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
        Loading reports...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px 0', color: 'var(--color-text-dim)', fontSize: 13 }}>
        having trouble reaching the api — retrying
      </div>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <div style={{ padding: '40px 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
        No reliability reports generated yet.
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-dim)',
          marginBottom: 16,
        }}
      >
        Provider Reliability Reports
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {providers.map(p => (
          <Link
            key={p.provider_slug}
            to={`/reports/${p.provider_slug}`}
            className="event-row"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              textDecoration: 'none',
              color: 'inherit',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  marginBottom: 4,
                }}
              >
                {p.provider_name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--color-text-dim)',
                }}
              >
                {p.report_count} report{p.report_count !== 1 ? 's' : ''}
                {p.latest_period && (
                  <span style={{ marginLeft: 8, color: 'var(--color-text-tertiary)' }}>
                    latest: {p.latest_period}
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--color-text-ghost)',
              }}
            >
              &rarr;
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
