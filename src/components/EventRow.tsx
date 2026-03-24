import { Link } from 'react-router-dom';
import type { EventListItem } from '@/types/api';
import { type EventTypeLookup, getEventLabel } from '@/hooks/useEventTypes';
import { relativeTime, formatUtcTime } from '@/lib/time';
import { truncateMiddle } from '@/lib/format';
import { useIsMobile } from '@/hooks/useIsMobile';
import { NetworkTag } from './NetworkTag';
import { SeverityMark } from './SeverityMark';

interface EventRowProps {
  event: EventListItem;
  visible: boolean;
  eventTypeLookup?: EventTypeLookup;
  showValidator?: boolean;
  showNetworkTag?: boolean;
}

export function EventRow({
  event,
  visible,
  eventTypeLookup,
  showValidator = true,
  showNetworkTag = true,
}: EventRowProps) {
  const isMobile = useIsMobile();
  const resolved = event.resolved_at != null;
  const isCritical = event.severity === 'critical';

  const displayName =
    event.validator_moniker ??
    (isMobile
      ? truncateMiddle(event.validator_address, 18)
      : event.validator_address);

  return (
    <div
      className={`event-row${isCritical ? ' event-row-critical' : ''}`}
      style={{
        padding: '14px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        opacity: visible ? (resolved ? 0.5 : 1) : 0,
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
        {!isMobile && (
          <span
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.4)',
              fontFamily: "'JetBrains Mono', monospace",
              minWidth: 62,
            }}
          >
            {formatUtcTime(event.started_at)}
          </span>
        )}

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
            color: 'rgba(255,255,255,0.35)',
            marginLeft: 'auto',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {relativeTime(event.started_at)}
        </span>
      </div>

      {/* Bottom row: validator name + description */}
      <div style={{ paddingLeft: isMobile ? 0 : 70, marginTop: isMobile ? 4 : 0 }}>
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
            {displayName}
          </Link>
        )}
        <span
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.5,
          }}
        >
          {getEventLabel(eventTypeLookup ?? new Map(), event.event_type, event.penalty_amount, event.penalty_token)}
        </span>
        {event.validator_stake != null && event.validator_stake_token && (
          <span
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.35)',
              fontFamily: "'JetBrains Mono', monospace",
              marginLeft: 8,
            }}
          >
            {Math.round(event.validator_stake).toLocaleString()} {event.validator_stake_token}
          </span>
        )}
      </div>
    </div>
  );
}
