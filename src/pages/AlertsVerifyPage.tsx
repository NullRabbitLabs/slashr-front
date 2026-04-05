import { useSearchParams, Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useVerify } from '@/hooks/useAlerts';
import { NETWORK_META } from '@/lib/constants';
import { truncateMiddle } from '@/lib/format';
import { NetworkTag } from '@/components/NetworkTag';

export default function AlertsVerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { data, loading, error } = useVerify(token);

  usePageMeta({
    title: 'Verify alert — slashr',
    description: 'Confirm your Slashr email alert subscription.',
  });

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 0' }}>
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
              color: 'var(--color-accent)',
              margin: 0,
            }}
          >
            Your alert is confirmed
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
            You'll receive emails when{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>
              {data.subscription.validator_name ?? truncateMiddle(data.subscription.target_address, 16)}
            </strong>
            {' '}on {NETWORK_META[data.subscription.chain]?.name ?? data.subscription.chain} has an incident.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NetworkTag network={data.subscription.chain} />
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
            {data.management_token && (
              <Link
                to={`/alerts/manage?token=${encodeURIComponent(data.management_token)}`}
                style={{
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--color-text-tertiary)',
                  textDecoration: 'none',
                }}
              >
                Manage your alerts →
              </Link>
            )}
            <Link
              to={`/validator/${data.subscription.chain}/${encodeURIComponent(data.subscription.target_address)}`}
              style={{
                fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--color-text-tertiary)',
                textDecoration: 'none',
              }}
            >
              View this validator →
            </Link>
          </div>
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
            {error.toLowerCase().includes('already')
              ? 'This alert was already confirmed.'
              : 'This verification link has expired or is invalid.'}
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
