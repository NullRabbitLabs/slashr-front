import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { EventListItem, ValidatorEventItem, NetworkSlug } from '@/types/api';
import { useValidator } from '@/hooks/useValidator';
import { useChainData } from '@/hooks/useChainData';
import { getEventLabel } from '@/lib/constants';
import { useIsMobile } from '@/hooks/useIsMobile';
import { usePageMeta } from '@/hooks/usePageMeta';
import { formatUtcTime } from '@/lib/time';
import { truncateMiddle, formatStakeCompact, formatCompact } from '@/lib/format';
import { NETWORK_META, EVENT_TYPE_DESCRIPTIONS } from '@/lib/constants';
import { NetworkTag } from './NetworkTag';
import { SeverityMark } from './SeverityMark';
import { Sparkline } from './Sparkline';
import { ChainDataSections } from './ChainDataSections';
import ScanAnalysisCard from './ScanAnalysisCard';

const STAGGER_DELAY = 120;

// --- Verdict logic ---

interface Verdict {
  text: string;
  level: 'neutral' | 'warning' | 'critical';
}

const VERDICT_COLORS: Record<Verdict['level'], string> = {
  neutral: 'var(--color-text-subtitle)',
  warning: 'var(--color-danger-dim)',
  critical: 'var(--color-danger)',
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

  if (in24h.length === 0) {
    return { text: 'No incidents in the last 24 hours.', level: 'neutral' };
  }

  if (in7d.length >= 3) {
    return {
      text: `${in7d.length} incidents in 7 days \u2014 this validator is struggling.`,
      level: 'critical',
    };
  }

  return {
    text: `${in24h.length} incident${in24h.length === 1 ? '' : 's'} in the last 24 hours.`,
    level: in24h.length >= 2 ? 'critical' : 'warning',
  };
}

// --- Shared styles ---

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-heading)',
  fontFamily: "'JetBrains Mono', monospace",
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '0 0 8px',
  borderBottom: '1px solid var(--color-border)',
  marginBottom: 4,
};

const metaLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-label)',
  fontFamily: "'Inter', sans-serif",
  marginBottom: 2,
};

const metaValueStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text-value)',
  fontFamily: "'JetBrains Mono', monospace",
};

// --- Title group types ---

interface TitleGroup {
  title: string;
  description: string | null;
  events: EventListItem[];
}

function buildTitleGroups(
  events: EventListItem[],
): TitleGroup[] {
  const map = new Map<string, TitleGroup>();
  for (const event of events) {
    const title = getEventLabel(event.event_type, null, null);
    if (!map.has(title)) {
      const description = EVENT_TYPE_DESCRIPTIONS[event.event_type as keyof typeof EVENT_TYPE_DESCRIPTIONS] ?? null;
      map.set(title, { title, description, events: [] });
    }
    map.get(title)!.events.push(event);
  }
  return Array.from(map.values());
}

// --- Component ---

export function ValidatorProfile() {
  const { network, address } = useParams<{ network: string; address: string }>();
  const { validator, loading, error } = useValidator(network ?? '', address ?? '');
  const { chainData } = useChainData(network ?? '', address ?? '');
  const isMobile = useIsMobile();

  // Keybase avatar for Cosmos validators
  const [keybaseAvatar, setKeybaseAvatar] = useState<string | null>(null);
  const cosmosIdentity = useMemo(() => {
    if (!chainData || chainData.network !== 'cosmos') return null;
    const cd = chainData.chain_data as Record<string, unknown>;
    const id = (cd.identity as string | undefined)
      ?? ((cd.description as Record<string, unknown> | undefined)?.identity as string | undefined);
    return id?.trim() || null;
  }, [chainData]);

  useEffect(() => {
    setKeybaseAvatar(null);
    if (!cosmosIdentity) return;
    let cancelled = false;
    fetch(`https://keybase.io/_/api/1.0/user/lookup.json?key_suffix=${encodeURIComponent(cosmosIdentity)}&fields=pictures`)
      .then(res => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then(json => {
        if (cancelled) return;
        const url = json?.them?.[0]?.pictures?.primary?.url;
        if (url) setKeybaseAvatar(url);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [cosmosIdentity]);

  // Ethereum pubkey for beaconcha.in link
  const ethPubkey = useMemo(() => {
    if (!chainData || chainData.network !== 'ethereum') return null;
    return (chainData.chain_data as Record<string, unknown>).pubkey as string | null;
  }, [chainData]);

  // Row limit for grouped events
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  // Stagger animation for event history
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());
  const pendingRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Enrich ValidatorEventItems to EventListItems for EventRow
  const enrichedEvents: EventListItem[] = useMemo(() => {
    if (!validator) return [];
    return validator.events.map(e => ({
      ...e,
      network: validator.network,
      validator_address: validator.address,
      validator_moniker: validator.moniker,
      validator_stake: validator.stake,
      validator_stake_token: validator.stake_token,
      validator_commission_pct: validator.commission_pct,
      validator_node_ip: validator.node_ip,
      validator_node_hostname: validator.node_hostname,
      validator_hosting_provider: validator.hosting_provider,
      validator_website: validator.website,
      has_contact: validator.has_contact,
      in_scan_db: validator.in_scan_db,
    }));
  }, [validator]);

  const titleGroups = useMemo(
    () => buildTitleGroups(enrichedEvents),
    [enrichedEvents],
  );

  useEffect(() => {
    if (!validator) return;

    setVisibleIds(new Set());
    pendingRef.current = titleGroups.map((_, i) => i);

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

  const suiName = useMemo(() => {
    if (!chainData || chainData.network !== 'sui') return undefined;
    return (chainData.chain_data as Record<string, unknown>).name as string | undefined;
  }, [chainData]);

  const metaDisplayName = validator
    ? (suiName?.trim() || validator.moniker?.trim() || truncateMiddle(validator.address, 20))
    : '';
  const metaNetworkName = network ? (NETWORK_META[network as NetworkSlug]?.name ?? network) : '';

  const verdictLabel = verdict
    ? { neutral: 'OK', warning: 'WARNING', critical: 'DEGRADED' }[verdict.level]
    : '';

  usePageMeta({
    title: validator
      ? `${metaDisplayName} \u00b7 ${metaNetworkName} \u00b7 slashr`
      : 'slashr',
    description: validator
      ? `${validator.events.length} incidents \u00b7 ${
          validator.stake != null && validator.stake_token
            ? `${formatStakeCompact(validator.stake)} ${validator.stake_token} at risk`
            : 'stake unknown'
        } \u00b7 Infrastructure: ${verdictLabel}`
      : 'Validator incident history on slashr.',
  });

  if (loading) return null;

  if (error || !validator) {
    const is404 = !validator || (error && error.includes('404'));
    const stubNetwork = network as NetworkSlug | undefined;
    const meta = stubNetwork ? NETWORK_META[stubNetwork] : undefined;
    const displayAddr = isMobile
      ? truncateMiddle(address ?? '', 24)
      : (address ?? '');

    if (is404 && address) {
      return (
        <div>
          <Link
            to="/"
            className="back-link"
            style={{
              display: 'inline-block',
              fontSize: 13,
              color: 'var(--color-text-tertiary)',
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: 24,
              padding: '8px 0',
            }}
          >
            &larr; back to feed
          </Link>

          <div
            style={{
              fontSize: 15,
              color: 'var(--color-text-subtitle)',
              fontFamily: "'Inter', sans-serif",
              marginBottom: 20,
            }}
          >
            No incidents recorded.
          </div>

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
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-ghost)',
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                validator
              </span>
              {meta && <NetworkTag network={stubNetwork!} />}
            </div>

            <div
              style={{
                fontSize: 13,
                color: 'var(--color-text-address)',
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 16,
                wordBreak: 'break-all',
              }}
            >
              {displayAddr}
            </div>
          </div>

          <div
            style={{
              padding: '20px 24px',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: '#14F195',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              Clean record
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-dim)',
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.5,
              }}
            >
              No incidents recorded{meta ? ` on ${meta.name}` : ''} since March 2025.
              This validator has a clean record on slashr.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <Link
          to="/"
          className="back-link"
          style={{
            fontSize: 13,
            color: 'var(--color-text-tertiary)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          &larr; back to feed
        </Link>
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-tertiary)',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '24px 0',
          }}
        >
          {error ?? 'validator not found'}
        </div>
      </div>
    );
  }

  const isNamed = !!(suiName?.trim() || validator.moniker?.trim());
  const displayAddress = isMobile
    ? truncateMiddle(validator.address, 24)
    : validator.address;
  const headerName = suiName?.trim() || (validator.moniker?.trim() ? validator.moniker! : validator.address);

  const showInfrastructure = validator.node_hostname || validator.node_ip || validator.hosting_provider || validator.in_scan_db;

  return (
    <div>
      {/* Back link */}
      <Link
        to="/"
        className="back-link"
        style={{
          display: 'inline-block',
          fontSize: 13,
          color: 'var(--color-text-tertiary)',
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
          {!isNamed && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--color-text-ghost)',
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginRight: 8,
              }}
            >
              unnamed validator
            </span>
          )}
          {keybaseAvatar && (
            <img
              src={keybaseAvatar}
              alt=""
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <h2
            style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: isNamed ? 700 : 400,
              fontFamily: isNamed ? "'Space Grotesk', sans-serif" : "'JetBrains Mono', monospace",
              letterSpacing: isNamed ? '-0.02em' : '0',
              margin: 0,
              color: isNamed ? 'var(--color-text-primary)' : 'var(--color-text-subtitle)',
              wordBreak: isNamed ? undefined : 'break-all',
            }}
          >
            {headerName}
          </h2>
          <NetworkTag network={validator.network} />
          {(() => {
            const net = NETWORK_META[validator.network]?.name ?? network;
            const total = validator.events.length;
            const hasSlash = validator.events.some(e => e.severity === 'critical');
            const ongoing = validator.events.filter(e => !e.resolved_at).length;
            let flavour = '';
            if (hasSlash) {
              flavour = `Slashed. ${total} incident${total === 1 ? '' : 's'} on record.`;
            } else if (ongoing > 0) {
              flavour = `${ongoing} ongoing incident${ongoing === 1 ? '' : 's'} right now.`;
            } else if (total > 0) {
              flavour = `${total} incident${total === 1 ? '' : 's'} on record. Eyes on this one.`;
            } else {
              flavour = 'Clean sheet so far.';
            }
            const tweetText = `\u26A1 ${headerName} on ${net} \u270C\uFE0F\n\n${flavour}\n\nvia @NullRabbitLabs`;
            const tweetUrl = `https://slashr.dev/validator/${encodeURIComponent(network ?? '')}/${encodeURIComponent(address ?? '')}`;
            const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(tweetUrl)}`;
            return (
              <a
                href={intentUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: 'var(--color-text-tertiary)',
                  textDecoration: 'none',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            );
          })()}
        </div>

        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-address)',
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
            color: 'var(--color-text-event-desc)',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 4 : 16,
          }}
        >
          <span>first event {formatUtcTime(validator.first_seen)}</span>
          <span>last event {formatUtcTime(validator.last_seen)}</span>
        </div>
      </div>

      {/* Enrichment info */}
      {(validator.stake != null || validator.commission_pct != null || validator.hosting_provider || validator.website || validator.in_scan_db) && (
        <div
          style={
            isMobile
              ? {
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 24,
                  paddingBottom: 24,
                  borderBottom: '1px solid var(--color-border)',
                }
              : {
                  display: 'flex',
                  flexWrap: 'wrap' as const,
                  gap: '12px 24px',
                  marginBottom: 24,
                  paddingBottom: 24,
                  borderBottom: '1px solid var(--color-border)',
                }
          }
        >
          {validator.stake != null && validator.stake_token && (
            <div>
              <div style={metaLabelStyle}>Stake</div>
              <div style={metaValueStyle} title={`${Math.round(validator.stake).toLocaleString()} ${validator.stake_token}`}>
                {formatCompact(Math.round(validator.stake))} {validator.stake_token} at risk
              </div>
            </div>
          )}
          {validator.commission_pct != null && (
            <div>
              <div style={metaLabelStyle}>Commission</div>
              <div style={metaValueStyle}>
                {Math.round(validator.commission_pct!)}%
                {validator.commission_pct === 100 && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-dim)', marginLeft: 8 }}>
                    delegators earn no rewards
                  </span>
                )}
              </div>
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
                  color: 'var(--color-text-hover)',
                  fontFamily: "'JetBrains Mono', monospace",
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 3,
                  padding: '2px 6px',
                }}
              >
                In scan DB
              </div>
            </div>
          )}
          {ethPubkey && (
            <div>
              <div style={metaLabelStyle}>Explorer</div>
              <a
                href={`https://beaconcha.in/validator/${ethPubkey}`}
                target="_blank"
                rel="noopener noreferrer"
                style={metaValueStyle}
              >
                beaconcha.in
              </a>
            </div>
          )}
        </div>
      )}

      {/* Chain-specific data sections */}
      {chainData && <ChainDataSections chainData={chainData} isMobile={isMobile} />}

      {/* Event history header */}
      <div style={sectionHeadingStyle}>
        event history
      </div>

      {titleGroups.length === 0 ? (
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-tertiary)',
            fontFamily: "'JetBrains Mono', monospace",
            padding: '24px 0',
          }}
        >
          no events recorded
        </div>
      ) : (
        titleGroups.map((tg, tgi) => {
          const visible = visibleIds.has(tgi);
          const MAX_VISIBLE = 3;
          const isGroupExpanded = expandedGroups.has(tgi);
          const visibleEvents = isGroupExpanded ? tg.events : tg.events.slice(0, MAX_VISIBLE);
          const hiddenCount = tg.events.length - MAX_VISIBLE;
          return (
            <div
              key={tg.title}
              style={{
                marginTop: tgi > 0 ? 12 : 0,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
              }}
            >
              {/* Compact rows — one per event, capped at 3 unless expanded */}
              {visibleEvents.map((ev) => {
                const isCosmosJailing = validator.network === 'cosmos' && ev.event_type === 'slashed_downtime';
                const unjailedByChainData = isCosmosJailing && chainData?.network === 'cosmos'
                  && (chainData.chain_data as Record<string, unknown>).jailed === false;
                const resolved = ev.resolved_at != null || unjailedByChainData;
                const dotColor = resolved ? 'var(--color-accent-dim)' : '#e8a735';
                return (
                  <React.Fragment key={ev.id}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 0',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                        flexShrink: 0,
                      }}
                    />
                    {!isMobile && (
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-tertiary)',
                          fontFamily: "'JetBrains Mono', monospace",
                          minWidth: 110,
                          flexShrink: 0,
                        }}
                      >
                        {formatUtcTime(ev.started_at)}
                      </span>
                    )}

                    <SeverityMark severity={ev.severity} />

                    {resolved ? (
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--color-accent-dim)',
                          fontFamily: "'JetBrains Mono', monospace",
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          flexShrink: 0,
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
                          flexShrink: 0,
                        }}
                      >
                        ongoing
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-event-title)',
                        fontFamily: "'Inter', sans-serif",
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tg.title}
                    </span>
                  </div>
                  {tgi === 0 && ev === visibleEvents[0] && (
                    <ScanAnalysisCard eventUuid={String(ev.id)} />
                  )}
                  </React.Fragment>
                );
              })}

              {/* Expand button for collapsed groups */}
              {!isGroupExpanded && hiddenCount > 0 && (
                <button
                  onClick={() => setExpandedGroups(prev => new Set(prev).add(tgi))}
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: 'var(--color-text-dim)',
                    cursor: 'pointer',
                    padding: '8px 0',
                    paddingLeft: 16,
                    background: 'none',
                    border: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '';
                    e.currentTarget.style.textDecoration = '';
                  }}
                >
                  + {hiddenCount} more events
                </button>
              )}

              {/* Shared description block */}
              {tg.description && (
                <div
                  style={{
                    marginTop: 12,
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--color-separator)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--color-text-event-title)',
                      fontFamily: "'Inter', sans-serif",
                      marginBottom: 6,
                    }}
                  >
                    {tg.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-dim)',
                      fontFamily: "'Inter', sans-serif",
                      lineHeight: 1.6,
                    }}
                  >
                    {tg.description}
                  </div>
                </div>
              )}
            </div>
          );
        })
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
            {validator.node_hostname && (
              <div style={{ gridColumn: isMobile ? 'span 2' : undefined }}>
                <div style={metaLabelStyle}>Hostname</div>
                <div style={{ ...metaValueStyle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{validator.node_hostname}</div>
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
            {validator.in_scan_db ? (
              <div>
                <div style={metaLabelStyle}>Scan status</div>
                <a
                  href="https://nullrabbit.ai/exposure"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...metaValueStyle, color: 'var(--color-accent-dim)', textDecoration: 'none' }}
                >
                  Security scan data available.
                </a>
              </div>
            ) : validator.node_ip ? (
              <div>
                <div style={metaLabelStyle}>Scan status</div>
                <div style={{ ...metaValueStyle, color: 'var(--color-text-body)' }}>
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
