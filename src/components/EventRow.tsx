import React from 'react';
import { Link } from 'react-router-dom';
import type { EventListItem } from '@/types/api';
import { getEventLabel } from '@/lib/constants';
import { relativeTime, formatUtcTime } from '@/lib/time';
import { formatStake, stripCidr } from '@/lib/format';
import { useIsMobile } from '@/hooks/useIsMobile';
import { EVENT_TYPE_DESCRIPTIONS } from '@/lib/constants';
import { NetworkTag } from './NetworkTag';
import { SeverityMark } from './SeverityMark';

interface EventRowProps {
  event: EventListItem;
  visible: boolean;
  showValidator?: boolean;
  showNetworkTag?: boolean;
  showDescription?: boolean;
  hideNodeIp?: boolean;
  groupCount?: number;
  groupDateRange?: string;
}

export function EventRow({
  event,
  visible,
  showValidator = true,
  showNetworkTag = true,
  showDescription = false,
  hideNodeIp = false,
  groupCount,
  groupDateRange,
}: EventRowProps) {
  const isMobile = useIsMobile();
  const resolved = event.resolved_at != null;
  const isCritical = event.severity === 'critical';

  const isNamed = !!(event.validator_moniker?.trim());
  const displayName = isNamed
    ? event.validator_moniker!
    : event.validator_address.slice(0, isMobile ? 8 : 6) + '...' + event.validator_address.slice(isMobile ? -6 : -4);

  const contentIndent = 0;

  const eventDescription = EVENT_TYPE_DESCRIPTIONS[event.event_type as keyof typeof EVENT_TYPE_DESCRIPTIONS] ?? null;

  return (
    <div
      className={`event-row${isCritical ? ' event-row-critical' : ''}`}
      style={{
        paddingTop: 14,
        paddingBottom: 14,
        borderBottom: '1px solid var(--color-border)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      {/* Top row: timestamp + tags + relative time */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 6 : 8,
          marginBottom: 6,
          flexWrap: isMobile ? 'wrap' : undefined,
        }}
      >
        {!isMobile && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--color-text-dim)',
              fontFamily: "'JetBrains Mono', monospace",
              minWidth: 110,
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
              color: 'var(--color-accent-dim)',
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
              color: '#e8a735',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 600,
            }}
          >
            ongoing
          </span>
        )}

        {groupCount != null && groupCount > 1 && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--color-text-dim)',
              fontFamily: "'JetBrains Mono', monospace",
              padding: '1px 5px',
              border: '1px solid var(--color-border)',
              borderRadius: 2,
            }}
          >
            x{groupCount}
          </span>
        )}

        <span
          style={{
            fontSize: isMobile ? 11 : 12,
            color: 'var(--color-text-dim)',
            marginLeft: 'auto',
            fontFamily: "'JetBrains Mono', monospace",
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {groupDateRange ?? relativeTime(event.started_at)}
        </span>
      </div>

      {/* Row 2: enrichment metadata (stake, commission) */}
      <EnrichmentRow event={event} isMobile={isMobile} hideNodeIp={hideNodeIp} indent={contentIndent} />

      {/* Row 3: validator name + label */}
      <div style={{ paddingLeft: contentIndent, marginTop: 8, display: isMobile ? 'flex' : undefined, flexDirection: isMobile ? 'column' : undefined }}>
        {showValidator && (
          <Link
            to={`/validator/${event.network}/${event.validator_address}`}
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--color-text-primary)',
              marginRight: isMobile ? 0 : 8,
            }}
          >
            {displayName}
          </Link>
        )}
        <span
          style={{
            fontSize: isMobile ? 13 : 14,
            color: showDescription ? 'var(--color-text-event-title)' : 'var(--color-text-event-desc)',
            lineHeight: 1.5,
            cursor: !isMobile && !showDescription && eventDescription ? 'help' : undefined,
            borderBottom: !isMobile && !showDescription && eventDescription ? '1px dotted var(--color-border-hover)' : undefined,
            marginTop: isMobile && showValidator ? 5 : undefined,
          }}
          title={!showDescription ? (eventDescription ?? undefined) : undefined}
        >
          {getEventLabel(event.event_type, event.penalty_amount, event.penalty_token)}
        </span>
        {/* Row 4: description */}
        {showDescription && eventDescription && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-body)',
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
  color: 'var(--color-text-tertiary)',
  fontFamily: "'JetBrains Mono', monospace",
};

const separatorStyle: React.CSSProperties = {
  ...pillStyle,
  margin: '0 6px',
  color: 'var(--color-text-ghost)',
};

function EnrichmentRow({ event, isMobile, hideNodeIp, indent }: { event: EventListItem; isMobile: boolean; hideNodeIp: boolean; indent: number }) {
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
        {Math.round(event.validator_commission_pct!)}% commission
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

  if (event.validator_hosting_provider && !hideNodeIp) {
    items.push(
      <span key="hosting" style={pillStyle}>
        {event.validator_hosting_provider}
      </span>,
    );
  }

  if (event.validator_website && !hideNodeIp) {
    const domain = event.validator_website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    items.push(
      <a
        key="website"
        href={event.validator_website}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...pillStyle, color: 'var(--color-accent-dim)', textDecoration: 'none' }}
      >
        {domain}
      </a>,
    );
  }

  if (event.in_scan_db && !hideNodeIp) {
    items.push(
      <span key="scan" style={{ ...pillStyle, color: 'var(--color-accent-dim)' }}>
        in scan DB
      </span>,
    );
  }

  if (items.length === 0) return null;

  return (
    <div style={{ paddingLeft: indent, marginTop: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={separatorStyle}>&middot;</span>}
          {item}
        </React.Fragment>
      ))}
    </div>
  );
}
