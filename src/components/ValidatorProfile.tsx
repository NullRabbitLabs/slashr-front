import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { EventListItem } from '@/types/api';
import { useValidator } from '@/hooks/useValidator';
import { NetworkTag } from './NetworkTag';
import { EventRow } from './EventRow';

const STAGGER_DELAY = 120;

export function ValidatorProfile() {
  const { network, address } = useParams<{ network: string; address: string }>();
  const { validator, loading, error } = useValidator(network ?? '', address ?? '');

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

  if (loading) return null;

  if (error || !validator) {
    return (
      <div>
        <Link
          to="/"
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.3)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          &larr; back to feed
        </Link>
        <div
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.3)',
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
  }));

  return (
    <div>
      {/* Back link */}
      <Link
        to="/"
        style={{
          display: 'inline-block',
          fontSize: 13,
          color: 'rgba(255,255,255,0.3)',
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 24,
        }}
      >
        &larr; back to feed
      </Link>

      {/* Validator header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <h2
            style={{
              fontSize: 24,
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
            color: 'rgba(255,255,255,0.3)',
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 8,
          }}
        >
          {validator.address}
        </div>

        <div
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.2)',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            gap: 16,
          }}
        >
          <span>first seen {new Date(validator.first_seen).toLocaleDateString()}</span>
          <span>last seen {new Date(validator.last_seen).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Enrichment info */}
      {(validator.stake != null || validator.commission_pct != null || validator.node_ip || validator.hosting_provider || validator.website || validator.in_scan_db) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px 24px',
            marginBottom: 24,
            paddingBottom: 24,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {validator.stake != null && validator.stake_token && (
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", marginBottom: 2 }}>Stake</div>
              <div style={{ fontSize: 13, color: '#E8E6E1', fontFamily: "'JetBrains Mono', monospace" }}>
                {validator.stake.toLocaleString()} {validator.stake_token}
              </div>
            </div>
          )}
          {validator.commission_pct != null && (
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", marginBottom: 2 }}>Commission</div>
              <div style={{ fontSize: 13, color: '#E8E6E1', fontFamily: "'JetBrains Mono', monospace" }}>{validator.commission_pct}%</div>
            </div>
          )}
          {validator.node_ip && (
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", marginBottom: 2 }}>Node IP</div>
              <div style={{ fontSize: 13, color: '#E8E6E1', fontFamily: "'JetBrains Mono', monospace" }}>{validator.node_ip}</div>
            </div>
          )}
          {validator.hosting_provider && (
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", marginBottom: 2 }}>Hosting</div>
              <div style={{ fontSize: 13, color: '#E8E6E1', fontFamily: "'JetBrains Mono', monospace" }}>{validator.hosting_provider}</div>
            </div>
          )}
          {validator.website && (
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", marginBottom: 2 }}>Website</div>
              <a
                href={validator.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#E8E6E1', fontFamily: "'JetBrains Mono', monospace" }}
              >
                {validator.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {validator.in_scan_db && (
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", marginBottom: 2 }}>&nbsp;</div>
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
      <div
        style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.25)',
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '0 0 8px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 4,
        }}
      >
        event history
      </div>

      {enrichedEvents.length === 0 ? (
        <div
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.3)',
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
            showValidator={false}
            showNetworkTag={false}
          />
        ))
      )}
    </div>
  );
}
