import { useState, useEffect } from 'react';
import type { ScanAnalysisDetail, ScanHealthPort } from '@/types/api';
import { fetchScanAnalysis } from '@/api/client';

interface ScanAnalysisCardProps {
  eventUuid: string;
}

const STATUS_COLORS: Record<string, string> = {
  up: '#14f195',
  degraded: '#F59E0B',
  down: '#FF4545',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ScanAnalysisCard({ eventUuid }: ScanAnalysisCardProps) {
  const [data, setData] = useState<ScanAnalysisDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchScanAnalysis(eventUuid)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [eventUuid]);

  if (loading || !data) return null;

  const analysis = data.analysis as Record<string, unknown>;
  const health = analysis.health as Record<string, unknown> | undefined;
  const healthStatus = (health?.status as string) || 'unknown';
  const statusColor = STATUS_COLORS[healthStatus] || 'rgba(255,255,255,0.4)';

  const ports = (health?.ports as ScanHealthPort[]) || [];
  const pattern = analysis.pattern as { total_events?: number; span_days?: number; events_per_day?: number } | undefined;
  const cves = analysis.cves as { total?: number; critical?: number } | undefined;

  const followUps = analysis.follow_ups as Array<Record<string, unknown>> | undefined;
  const pipeline = analysis.pipeline as { completed_at?: string } | undefined;
  const scannedAt = pipeline?.completed_at;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      marginBottom: 8,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase' as const,
        }}>
          Scan Analysis
        </span>
        {scannedAt && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'var(--color-text-dim)',
          }}>
            {relativeTime(scannedAt)}
          </span>
        )}
      </div>

      {/* Status badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 6,
        background: `${statusColor}15`,
        marginBottom: 12,
      }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: statusColor,
          display: 'inline-block',
        }} />
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
          fontWeight: 600,
          color: statusColor,
          textTransform: 'uppercase' as const,
        }}>
          {healthStatus}
        </span>
      </div>

      {/* Port grid */}
      {ports.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            color: 'var(--color-text-secondary)',
            marginBottom: 6,
          }}>
            Ports
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(ports.length, 4)}, 1fr)`,
            gap: 6,
          }}>
            {ports.map((port) => (
              <div key={port.port} style={{
                border: `1px solid ${port.open ? '#14f19540' : '#FF454540'}`,
                borderRadius: 8,
                padding: '8px 10px',
                textAlign: 'center' as const,
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                }}>
                  {port.port}
                </div>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 10,
                  color: 'var(--color-text-dim)',
                  marginBottom: 4,
                }}>
                  {port.name}
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                  color: port.open ? '#14f195' : '#FF4545',
                }}>
                  {port.open
                    ? port.latency_ms ? `${port.latency_ms}ms` : 'open'
                    : 'down'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pattern + CVEs */}
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        color: 'var(--color-text-secondary)',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 4,
      }}>
        {pattern && (pattern.total_events ?? 0) > 1 && (
          <div>
            Pattern: {pattern.total_events} events in {pattern.span_days} days ({typeof pattern.events_per_day === 'number' ? pattern.events_per_day.toFixed(1) : pattern.events_per_day}/day)
          </div>
        )}
        {cves && (
          <div style={{
            color: (cves.critical ?? 0) > 0 ? '#FF4545' : 'var(--color-text-secondary)',
          }}>
            CVEs: {cves.total ?? 0} found{(cves.critical ?? 0) > 0 ? ` (${cves.critical} critical)` : ''}
          </div>
        )}
      </div>

      {/* Follow-up timeline */}
      {followUps && followUps.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase' as const,
            marginBottom: 8,
          }}>
            Follow-ups
          </div>
          <div style={{ position: 'relative', paddingLeft: 16 }}>
            <div style={{
              position: 'absolute',
              left: 3,
              top: 4,
              bottom: 4,
              width: 1,
              background: 'var(--color-border-strong)',
            }} />
            {followUps.map((fu, i) => {
              const fuHealth = fu.health as Record<string, unknown> | undefined;
              const fuStatus = (fuHealth?.status as string) || 'unknown';
              const fuColor = STATUS_COLORS[fuStatus] || 'rgba(255,255,255,0.4)';
              const historyEntry = data.history.find(h => h.follow_up_round === i + 1);
              const timestamp = historyEntry?.received_at;
              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '3px 0',
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute',
                    left: -14,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: fuColor,
                  }} />
                  {timestamp && (
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                      color: 'var(--color-text-dim)',
                      flexShrink: 0,
                    }}>
                      {relativeTime(timestamp)}
                    </span>
                  )}
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    color: fuColor,
                  }}>
                    {fuStatus}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reply link */}
      {data.reply.status === 'sent' && data.reply.tweet_id && (
        <div style={{ marginTop: 10 }}>
          <a
            href={`https://x.com/i/web/status/${data.reply.tweet_id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
            }}
          >
            View reply tweet
          </a>
        </div>
      )}
    </div>
  );
}
