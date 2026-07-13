import { useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useManageSubscriptions } from '@/hooks/useAlerts';
import { truncateMiddle } from '@/lib/format';
import { NetworkTag } from '@/components/NetworkTag';
import type { AlertSubscription } from '@/types/api';

export default function AlertsManagePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { data, loading, error, removingId, remove } = useManageSubscriptions(token);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  usePageMeta({
    title: 'Manage alerts · slashr',
    description: 'Manage your Slashr email alert subscriptions.',
  });

  const handleRemove = (sub: AlertSubscription) => {
    if (confirmId === sub.id) {
      remove(sub);
      setConfirmId(null);
    } else {
      setConfirmId(sub.id);
    }
  };

  return (
    <div style={{ padding: '32px 0' }}>
      <h2
        style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-dim)',
          margin: '0 0 8px',
        }}
      >
        Your Slashr Alerts
      </h2>

      {loading && (
        <p style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", color: 'var(--color-text-dim)' }}>
          Loading...
        </p>
      )}

      {error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p
            style={{
              fontSize: 14,
              fontFamily: "'Inter', sans-serif",
              color: 'var(--color-text-secondary)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {error.toLowerCase().includes('invalid') || error.toLowerCase().includes('expired')
              ? 'This management link has expired or is invalid.'
              : error}
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
            Subscribe to alerts →
          </Link>
        </div>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email + count */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                color: 'var(--color-text-secondary)',
              }}
            >
              {data.email_masked}
            </span>
            <span
              style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--color-text-dim)',
                padding: '2px 8px',
                border: '1px solid var(--color-border)',
                borderRadius: 3,
              }}
            >
              {data.subscriptions.length} of {data.max_subscriptions} alerts used
            </span>
          </div>

          {/* Subscription list */}
          {data.subscriptions.length === 0 && (
            <p style={{ fontSize: 13, fontFamily: "'Inter', sans-serif", color: 'var(--color-text-dim)' }}>
              No active subscriptions.
            </p>
          )}

          {data.subscriptions.map(sub => (
            <div
              key={sub.id}
              style={{
                padding: '12px 14px',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <NetworkTag network={sub.chain} />
                  <span
                    style={{
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: 'var(--color-text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sub.validator_name ?? truncateMiddle(sub.target_address, 20)}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: 'var(--color-text-dim)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {sub.target_type}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(sub)}
                  disabled={removingId === sub.id}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 3,
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: removingId === sub.id ? 'not-allowed' : 'pointer',
                    background: confirmId === sub.id ? 'rgba(255,69,69,0.1)' : 'transparent',
                    color: confirmId === sub.id ? 'var(--color-danger)' : 'var(--color-text-dim)',
                    border: `1px solid ${confirmId === sub.id ? 'rgba(255,69,69,0.3)' : 'var(--color-border)'}`,
                  }}
                >
                  {removingId === sub.id ? '...' : confirmId === sub.id ? 'Confirm remove' : 'Remove'}
                </button>
              </div>

              {/* Wallet delegations */}
              {sub.target_type === 'wallet' && sub.delegations && sub.delegations.length > 0 && (
                <div
                  style={{
                    paddingLeft: 16,
                    borderLeft: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: 'var(--color-text-dim)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Monitoring validators
                  </span>
                  {sub.delegations.map(d => (
                    <span
                      key={d.address}
                      style={{
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {d.name ?? truncateMiddle(d.address, 16)}
                    </span>
                  ))}
                </div>
              )}

              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'Inter', sans-serif",
                  color: 'var(--color-text-ghost)',
                }}
              >
                Subscribed {new Date(sub.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          ))}

          {/* Add more link */}
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
            Add another alert →
          </Link>
        </div>
      )}
    </div>
  );
}
