import React from 'react';
import { Link } from 'react-router-dom';
import type { EventListItem } from '@/types/api';
import { type EventTypeLookup, getEventLabel } from '@/hooks/useEventTypes';
import { relativeTime, formatUtcTime } from '@/lib/time';
import { truncateMiddle, formatStake, stripCidr } from '@/lib/format';
import { useIsMobile } from '@/hooks/useIsMobile';
import { NetworkTag } from './NetworkTag';
import { SeverityMark } from './SeverityMark';

interface EventRowProps {
  event: EventListItem;
  visible: boolean;
  eventTypeLookup?: EventTypeLookup;
  showValidator?: boolean;
  showNetworkTag?: boolean;
  showDescription?: boolean;
  hideNodeIp?: boolean;
}

export function EventRow({
  event,
  visible,
  eventTypeLookup,
  showValidator = true,
  showNetworkTag = true,
  showDescription = false,
  hideNodeIp = false,
}: EventRowProps) {
  const isMobile = useIsMobile();
  const resolved = event.resolved_at != null;
  const isCritical = event.severity === 'critical';

  const displayName =
    event.validator_moniker ??
    (isMobile
      ? truncateMiddle(event.validator_address, 18)
      : event.validator_address);

  const lookup = eventTypeLookup ?? new Map();
  const eventTypeInfo = lookup.get(event.event_type);
  const eventDescription = eventTypeInfo?.description ?? null;

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

        {resolved ? (
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
        ) : (
          <span
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.3)',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            ongoing
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

      {/* Row 2: enrichment metadata (stake, commission, IP) */}
      <EnrichmentRow event={event} isMobile={isMobile} hideNodeIp={hideNodeIp} />

      {/* Row 3: validator name + label */}
      <div style={{ paddingLeft: isMobile ? 0 : 70, marginTop: 8 }}>
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
            cursor: !showDescription && eventDescription ? 'help' : undefined,
            borderBottom: !showDescription && eventDescription ? '1px dotted rgba(255,255,255,0.2)' : undefined,
          }}
          title={!showDescription ? (eventDescription ?? undefined) : undefined}
        >
          {getEventLabel(lookup, event.event_type, event.penalty_amount, event.penalty_token)}
        </span>
        {/* Row 4: description */}
        {showDescription && eventDescription && (
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.35)',
              fontFamily: "'Inter', sans-serif",
              marginTop: 6,
              lineHeight: 1.4,
            }}
          >
            {eventDescription}
          </div>
        )}
      </div>
    </div>
  );
}

const pillStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.35)',
  fontFamily: "'JetBrains Mono', monospace",
};

const separatorStyle: React.CSSProperties = {
  ...pillStyle,
  margin: '0 6px',
  color: 'rgba(255,255,255,0.15)',
};

function EnrichmentRow({ event, isMobile, hideNodeIp }: { event: EventListItem; isMobile: boolean; hideNodeIp: boolean }) {
  const items: React.ReactNode[] = [];

  if (event.validator_stake != null && event.validator_stake_token) {
    items.push(
      <span key="stake" style={pillStyle}>
        {formatStake(event.validator_stake, event.validator_stake_token)}
      </span>,
    );
  }

  if (event.validator_commission_pct != null) {
    items.push(
      <span key="commission" style={pillStyle}>
        {event.validator_commission_pct}% commission
      </span>,
    );
  }

  if (event.validator_node_ip && !isMobile && !hideNodeIp) {
    items.push(
      <span key="ip" style={pillStyle}>
        {stripCidr(event.validator_node_ip)}
      </span>,
    );
  }

  if (event.validator_hosting_provider) {
    items.push(
      <span key="hosting" style={pillStyle}>
        {event.validator_hosting_provider}
      </span>,
    );
  }

  if (event.validator_website) {
    const domain = event.validator_website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    items.push(
      <a
        key="website"
        href={event.validator_website}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...pillStyle, color: 'rgba(20,241,149,0.5)', textDecoration: 'none' }}
      >
        {domain}
      </a>,
    );
  }

  if (event.in_scan_db) {
    items.push(
      <span key="scan" style={{ ...pillStyle, color: 'rgba(20,241,149,0.5)' }}>
        in scan DB
      </span>,
    );
  }

  if (items.length === 0) return null;

  return (
    <div style={{ paddingLeft: isMobile ? 0 : 70, marginTop: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={separatorStyle}>·</span>}
          {item}
        </React.Fragment>
      ))}
    </div>
  );
}
