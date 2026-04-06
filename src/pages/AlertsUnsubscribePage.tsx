import { useSearchParams, Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useUnsubscribe } from '@/hooks/useAlerts';
import { truncateMiddle } from '@/lib/format';
import { NetworkTag } from '@/components/NetworkTag';

export default function AlertsUnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { info, confirmed, loading, confirming, error, confirm } = useUnsubscribe(token);

  usePageMeta({
    title: 'Unsubscribe — slashr',
    description: 'Unsubscribe from Slashr email alerts.',
  });

  return (
    <div style={{ padding: '32px 0' }}>
      {loading && (
        <p style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", color: 'var(--color-text-dim)' }}>
          Loading...
        </p>
      )}

      {/* Step 1: Show subscription info + confirm button */}
      {info && !confirmed && (
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
            Unsubscribe from alerts?
          </h2>
          <div
            style={{
              padding: '14px 16px',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <NetworkTag network={info.chain} />
            <span
              style={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--color-text-primary)',
              }}
            >
              {truncateMiddle(info.target_address, 20)}
            </span>
            <span
              style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--color-text-dim)',
                textTransform: 'uppercase',
              }}
            >
              {info.target_type}
            </span>
          </div>
          <button
            onClick={confirm}
            disabled={confirming}
            style={{
              padding: '10px 20px',
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: confirming ? 'not-allowed' : 'pointer',
              background: confirming ? 'var(--color-bg-surface)' : 'rgba(255,69,69,0.1)',
              color: confirming ? 'var(--color-text-dim)' : 'var(--color-danger)',
              border: `1px solid ${confirming ? 'var(--color-border)' : 'rgba(255,69,69,0.3)'}`,
              alignSelf: 'flex-start',
            }}
          >
            {confirming ? 'Unsubscribing...' : 'Confirm unsubscribe'}
          </button>
        </div>
      )}

      {/* Step 2: Confirmed */}
      {confirmed && (
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
            {confirmed.message}
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

      {/* Error */}
      {error && !info && (
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

      {/* Error during confirm step */}
      {error && info && !confirmed && (
        <p style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", color: 'var(--color-danger)', marginTop: 8 }}>
          {error}
        </p>
      )}
    </div>
  );
}
