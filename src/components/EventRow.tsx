import { Link } from 'react-router-dom';
import type { EventListItem } from '@/types/api';
import { describeEvent } from '@/lib/constants';
import { relativeTime, formatUtcTime } from '@/lib/time';
import { NetworkTag } from './NetworkTag';
import { SeverityMark } from './SeverityMark';

interface EventRowProps {
  event: EventListItem;
  visible: boolean;
  showValidator?: boolean;
  showNetworkTag?: boolean;
}

export function EventRow({
  event,
  visible,
  showValidator = true,
  showNetworkTag = true,
}: EventRowProps) {
  const resolved = event.resolved_at != null;

  return (
    <div
      style={{
        padding: '14px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        opacity: visible ? (resolved ? 0.4 : 1) : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      {/* Top row: timestamp + tags + relative time */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.2)',
            fontFamily: "'JetBrains Mono', monospace",
            minWidth: 62,
          }}
        >
          {formatUtcTime(event.started_at)}
        </span>

        {showNetworkTag && <NetworkTag network={event.network} />}

        <SeverityMark severity={event.severity} />

        {resolved && (
          <span
            style={{
              fontSize: 10,
              color: 'rgba(20,241,149,0.6)',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            resolved
          </span>
        )}

        <span
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.15)',
            marginLeft: 'auto',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {relativeTime(event.started_at)}
        </span>
      </div>

      {/* Bottom row: validator name + description */}
      <div style={{ paddingLeft: 70 }}>
        {showValidator && (
          <Link
            to={`/validator/${event.network}/${event.validator_address}`}
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: '#E8E6E1',
              marginRight: 8,
            }}
          >
            {event.validator_moniker ?? event.validator_address}
          </Link>
        )}
        <span
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.5,
          }}
        >
          {describeEvent(event.event_type, event.penalty_amount, event.penalty_token)}
        </span>
      </div>
    </div>
  );
}
