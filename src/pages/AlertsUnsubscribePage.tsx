import { useSearchParams, Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useUnsubscribe } from '@/hooks/useAlerts';
import { NETWORK_META } from '@/lib/constants';
import { truncateMiddle } from '@/lib/format';

export default function AlertsUnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { data, loading, error } = useUnsubscribe(token);

  usePageMeta({
    title: 'Unsubscribe — slashr',
    description: 'Unsubscribe from Slashr email alerts.',
  });

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 0' }}>
      {loading && (
        <p style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", color: 'var(--color-text-dim)' }}>
          Unsubscribing...
        </p>
      )}

      {data && (
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
            You've been unsubscribed
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
            You won't receive further alerts for{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>
              {truncateMiddle(data.target_address, 16)}
            </strong>
            {' '}on {NETWORK_META[data.chain]?.name ?? data.chain}.
          </p>
          <Link
            to="/alerts"
            style={{
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--color-text-tertiary)',
              textDecoration: 'none',
            }}
          >
            Changed your mind? Subscribe again →
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
            This unsubscribe link has expired or is invalid.
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
            Go to alerts →
          </Link>
        </div>
      )}
    </div>
  );
}
