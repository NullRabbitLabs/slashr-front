import { Link } from 'react-router-dom';
import type { DelegationItem } from '@/types/api';
import { truncateMiddle } from '@/lib/format';
import { relativeTime } from '@/lib/time';
import { EVENT_TYPE_LABELS } from '@/lib/constants';
import type { EventType } from '@/types/api';

interface DelegationCardProps {
  delegation: DelegationItem;
}

function severityColor(score: number): string {
  if (score === 0) return '#14F195'; // green
  if (score <= 4) return '#F5A623';  // yellow/amber
  return '#FF4545';                   // red
}

export function DelegationCard({ delegation }: DelegationCardProps) {
  const score = delegation.severity_score_30d;
  const dotColor = severityColor(score);
  const hasEvents = delegation.recent_events.length > 0;

  return (
    <div
      style={{
        padding: '16px 20px',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 4,
        marginBottom: 8,
      }}
    >
      {/* Header: moniker + severity dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
          }}
        />
        {delegation.slashr_url ? (
          <Link
            to={delegation.slashr_url}
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {delegation.moniker || truncateMiddle(delegation.validator_address, 20)}
          </Link>
        ) : (
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {delegation.moniker || truncateMiddle(delegation.validator_address, 20)}
          </span>
        )}
      </div>

      {/* Stake info */}
      {delegation.stake_amount && delegation.stake_token && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: hasEvents ? 10 : 0,
          }}
        >
          {delegation.stake_amount} {delegation.stake_token} staked
        </div>
      )}

      {/* Recent events */}
      {hasEvents ? (
        <div style={{ marginTop: 4 }}>
          {delegation.recent_events.map((evt, i) => (
            <div
              key={i}
              style={{
                fontSize: 12,
                color: evt.severity === 'critical' ? 'var(--color-danger)' : 'var(--color-text-tertiary)',
                fontFamily: "'Inter', sans-serif",
                padding: '3px 0',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <span>{EVENT_TYPE_LABELS[evt.event_type as EventType] || evt.event_type}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                {relativeTime(evt.started_at)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-tertiary)',
            fontFamily: "'Inter', sans-serif",
            marginTop: 4,
          }}
        >
          No incidents
        </div>
      )}

      {/* Validator address (small, muted) */}
      <div
        style={{
          fontSize: 11,
          color: 'var(--color-text-dim)',
          fontFamily: "'JetBrains Mono', monospace",
          marginTop: 8,
        }}
      >
        {truncateMiddle(delegation.validator_address, 32)}
      </div>
    </div>
  );
}
