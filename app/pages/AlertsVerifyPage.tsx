import { useSearchParams, Link } from 'react-router';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useVerify } from '@/hooks/useAlerts';

export default function AlertsVerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { data, loading, error } = useVerify(token);

  usePageMeta({
    title: 'Verify alert — slashr',
    description: 'Confirm your Slashr email alert subscription.',
  });

  return (
    <div style={{ padding: '32px 0' }}>
      {loading && (
        <p style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", color: 'var(--color-text-dim)' }}>
          Verifying...
        </p>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2
            style={{
              fontSize: 18,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              color: data.status === 'already_verified' ? 'var(--color-text-primary)' : 'var(--color-accent)',
              margin: 0,
            }}
          >
            {data.status === 'already_verified'
              ? 'This alert was already confirmed.'
              : 'Your alert is confirmed'}
          </h2>
          <p
            style={{
              fontSize: 14,
              fontFamily: "'Inter', sans-serif",
              color: 'var(--color-text-secondary)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {data.message}
          </p>
          <Link
            to="/alerts"
            style={{
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--color-text-tertiary)',
              textDecoration: 'none',
              marginTop: 8,
            }}
          >
            Subscribe to more alerts →
          </Link>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2
            style={{
              fontSize: 18,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            This verification link has expired or is invalid.
          </h2>
          <Link
            to="/alerts"
            style={{
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--color-text-tertiary)',
              textDecoration: 'none',
            }}
          >
            Subscribe to alerts →
          </Link>
        </div>
      )}
    </div>
  );
}
