import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { EventListItem, ValidatorEventItem } from '@/types/api';
import { useValidator } from '@/hooks/useValidator';
import { useEventTypes } from '@/hooks/useEventTypes';
import { useIsMobile } from '@/hooks/useIsMobile';
import { truncateMiddle } from '@/lib/format';
import { NetworkTag } from './NetworkTag';
import { EventRow } from './EventRow';
import { Sparkline } from './Sparkline';

const STAGGER_DELAY = 120;

// --- Verdict logic ---

interface Verdict {
  text: string;
  level: 'neutral' | 'warning' | 'critical';
}

const VERDICT_COLORS: Record<Verdict['level'], string> = {
  neutral: 'rgba(255,255,255,0.45)',
  warning: 'rgba(255,69,69,0.7)',
  critical: '#FF4545',
};

function computeVerdict(events: ValidatorEventItem[]): Verdict {
  if (events.length === 0) {
    return { text: 'No incidents recorded.', level: 'neutral' };
  }

  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  const in7d = events.filter(e => now - new Date(e.started_at).getTime() < SEVEN_DAYS);
  const in24h = events.filter(e => now - new Date(e.started_at).getTime() < TWENTY_FOUR_HOURS);

  if (in7d.length === 0) {
    return { text: 'No recent incidents.', level: 'neutral' };
  }

  if (in24h.length > 0) {
    return {
      text: `${in24h.length} incident${in24h.length === 1 ? '' : 's'} in the last 24 hours.`,
      level: 'critical',
    };
  }

  if (in7d.length >= 3) {
    return {
      text: `${in7d.length} incidents in 7 days \u2014 this validator is struggling.`,
      level: 'critical',
    };
  }

  return {
    text: `${in7d.length} incident${in7d.length === 1 ? '' : 's'} in the last 7 days.`,
    level: 'warning',
  };
}

// --- Shared styles ---

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.45)',
  fontFamily: "'JetBrains Mono', monospace",
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '0 0 8px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  marginBottom: 4,
};

const metaLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.4)',
  fontFamily: "'Inter', sans-serif",
  marginBottom: 2,
};

const metaValueStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#E8E6E1',
  fontFamily: "'JetBrains Mono', monospace",
};

// --- Component ---

export function ValidatorProfile() {
  const { network, address } = useParams<{ network: string; address: string }>();
  const { validator, loading, error } = useValidator(network ?? '', address ?? '');
  const { lookup: eventTypeLookup } = useEventTypes();
  const isMobile = useIsMobile();

  // Stagger animation for event history
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());
  const pendingRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!validator) return;

    setVisibleIds(new Set());
    pendingRef.current = validator.events.map(e => e.id);

    timerRef.current = setInterval(() => {
      const nextId = pendingRef.current.shift();
      if (nextId !== undefined) {
        setVisibleIds(prev => new Set([...prev, nextId]));
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, STAGGER_DELAY);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [validator]);

  const verdict = useMemo(
    () => validator ? computeVerdict(validator.events) : null,
    [validator],
  );

  if (loading) return null;

  if (error || !validator) {
    return (
      <div>
        <Link
          to="/"
          className="back-link"
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          &larr; back to feed
        </Link>
        <div
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '24px 0',
          }}
        >
          {error ?? 'validator not found'}
        </div>
      </div>
    );
  }

  // Enrich ValidatorEventItems to EventListItems for EventRow
  const enrichedEvents: EventListItem[] = validator.events.map(e => ({
    ...e,
    network: validator.network,
    validator_address: validator.address,
    validator_moniker: validator.moniker,
    validator_stake: validator.stake,
    validator_stake_token: validator.stake_token,
    validator_commission_pct: validator.commission_pct,
    validator_node_ip: validator.node_ip,
    validator_hosting_provider: validator.hosting_provider,
    validator_website: validator.website,
    has_contact: validator.has_contact,
    in_scan_db: validator.in_scan_db,
  }));

  const displayAddress = isMobile
    ? truncateMiddle(validator.address, 24)
    : validator.address;

  const showInfrastructure = validator.node_ip || validator.hosting_provider || validator.in_scan_db;

  return (
    <div>
      {/* Back link */}
      <Link
        to="/"
        className="back-link"
        style={{
          display: 'inline-block',
          fontSize: 13,
          color: 'rgba(255,255,255,0.45)',
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 24,
          padding: '8px 0',
        }}
      >
        &larr; back to feed
      </Link>

      {/* Verdict banner */}
      {verdict && (
        <div
          style={{
            fontSize: 15,
            color: VERDICT_COLORS[verdict.level],
            fontFamily: "'Inter', sans-serif",
            marginBottom: 20,
          }}
        >
          {verdict.text}
        </div>
      )}

      {/* Sparkline */}
      <Sparkline events={validator.events} />

      {/* Validator header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8,
            flexWrap: 'wrap',
          }}
        >
          <h2
            style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {validator.moniker ?? validator.address}
          </h2>
          <NetworkTag network={validator.network} />
        </div>

        <div
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 8,
            wordBreak: 'break-all',
          }}
        >
          {displayAddress}
        </div>

        <div
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 4 : 16,
          }}
        >
          <span>first seen {new Date(validator.first_seen).toLocaleDateString()}</span>
          <span>last seen {new Date(validator.last_seen).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Enrichment info */}
      {(validator.stake != null || validator.commission_pct != null || validator.node_ip || validator.hosting_provider || validator.website || validator.in_scan_db) && (
        <div
          style={
            isMobile
              ? {
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 24,
                  paddingBottom: 24,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }
              : {
                  display: 'flex',
                  flexWrap: 'wrap' as const,
                  gap: '12px 24px',
                  marginBottom: 24,
                  paddingBottom: 24,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }
          }
        >
          {validator.stake != null && validator.stake_token && (
            <div>
              <div style={metaLabelStyle}>Stake</div>
              <div style={metaValueStyle}>
                {validator.stake.toLocaleString()} {validator.stake_token} at risk
              </div>
            </div>
          )}
          {validator.commission_pct != null && (
            <div>
              <div style={metaLabelStyle}>Commission</div>
              <div style={metaValueStyle}>{validator.commission_pct}%</div>
            </div>
          )}
          {validator.node_ip && (
            <div>
              <div style={metaLabelStyle}>Node IP</div>
              <div style={metaValueStyle}>{validator.node_ip}</div>
            </div>
          )}
          {validator.hosting_provider && (
            <div>
              <div style={metaLabelStyle}>Hosting</div>
              <div style={metaValueStyle}>{validator.hosting_provider}</div>
            </div>
          )}
          {validator.website && (
            <div>
              <div style={metaLabelStyle}>Website</div>
              <a
                href={validator.website}
                target="_blank"
                rel="noopener noreferrer"
                style={metaValueStyle}
              >
                {validator.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {validator.in_scan_db && (
            <div>
              <div style={metaLabelStyle}>&nbsp;</div>
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: "'JetBrains Mono', monospace",
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 3,
                  padding: '2px 6px',
                }}
              >
                In scan DB
              </div>
            </div>
          )}
        </div>
      )}

      {/* Event history header */}
      <div style={sectionHeadingStyle}>
        event history
      </div>

      {enrichedEvents.length === 0 ? (
        <div
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '24px 0',
          }}
        >
          no events recorded
        </div>
      ) : (
        enrichedEvents.map(event => (
          <EventRow
            key={event.id}
            event={event}
            visible={visibleIds.has(event.id)}
            eventTypeLookup={eventTypeLookup}
            showValidator={false}
            showNetworkTag={false}
            showDescription
          />
        ))
      )}

      {/* Infrastructure section */}
      {showInfrastructure && (
        <div style={{ marginTop: 32 }}>
          <div style={sectionHeadingStyle}>
            infrastructure
          </div>

          <div
            style={
              isMobile
                ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 0' }
                : { display: 'flex', flexWrap: 'wrap' as const, gap: '12px 24px', padding: '16px 0' }
            }
          >
            {validator.node_ip && (
              <div>
                <div style={metaLabelStyle}>Node IP</div>
                <div style={metaValueStyle}>{validator.node_ip}</div>
              </div>
            )}
            {validator.hosting_provider && (
              <div>
                <div style={metaLabelStyle}>Hosting</div>
                <div style={metaValueStyle}>{validator.hosting_provider}</div>
              </div>
            )}
            {validator.in_scan_db ? (
              <div>
                <div style={metaLabelStyle}>Security</div>
                <a
                  href="https://nullrabbit.ai/exposure"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...metaValueStyle, color: 'rgba(20,241,149,0.6)', textDecoration: 'none' }}
                >
                  Security scan data available.
                </a>
              </div>
            ) : validator.node_ip ? (
              <div>
                <div style={metaLabelStyle}>Security</div>
                <div style={{ ...metaValueStyle, color: 'rgba(255,255,255,0.35)' }}>
                  Not yet scanned.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
