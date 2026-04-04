import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { HealthValidator, NetworkSlug } from '@/types/api';
import { GradeBadge } from './GradeBadge';
import { AlternativesList } from './AlternativesList';
import { gradeColor, showAlternatives } from '@/lib/grades';
import { formatUsd, formatHours, truncateMiddle } from '@/lib/format';
import { EVENT_TYPE_LABELS } from '@/lib/constants';

interface Props {
  validator: HealthValidator;
  network: NetworkSlug;
}

export function ValidatorBreakdownCard({ validator: v, network }: Props) {
  const [expanded, setExpanded] = useState(false);
  const costZero = (v.cost_of_downtime.total_usd ?? 0) === 0;

  return (
    <div
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 4,
        padding: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <GradeBadge grade={v.grade} size="md" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                color: 'var(--color-text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {v.name ?? truncateMiddle(v.address, 20)}
            </span>
            <span
              style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                color: gradeColor(v.grade),
              }}
            >
              {v.score}
            </span>
          </div>
        </div>
        <Link
          to={`/validator/${network}/${encodeURIComponent(v.address)}`}
          style={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-text-dim)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          view &rarr;
        </Link>
      </div>

      {/* Cost section */}
      <div style={{ marginBottom: 12 }}>
        {costZero ? (
          <div
            style={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--color-accent)',
            }}
          >
            No downtime costs
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--color-danger)',
              }}
            >
              {formatUsd(v.cost_of_downtime.total_usd)} over {v.cost_of_downtime.period_days}d
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "'Inter', sans-serif",
                color: 'var(--color-text-dim)',
                marginTop: 2,
              }}
            >
              {v.cost_of_downtime.incident_count} incident{v.cost_of_downtime.incident_count !== 1 ? 's' : ''}
              {' \u00b7 '}
              {formatHours(v.cost_of_downtime.total_downtime_hours)} total downtime
            </div>
          </>
        )}
      </div>

      {/* Latest event */}
      {v.latest_event && (
        <div
          style={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-text-dim)',
            padding: '6px 0',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          Latest: {EVENT_TYPE_LABELS[v.latest_event.event_type] ?? v.latest_event.event_type}
          {v.latest_event.duration_minutes != null && (
            <span> ({formatHours(v.latest_event.duration_minutes / 60)})</span>
          )}
        </div>
      )}

      {/* Scan summary */}
      {v.scan_summary && (
        <div
          style={{
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: v.scan_summary.health === 'DEGRADED' ? '#F5A623' : v.scan_summary.health === 'DOWN' ? 'var(--color-danger)' : 'var(--color-text-dim)',
            padding: '6px 0',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          Scan: {v.scan_summary.health ?? 'Unknown'}
          {v.scan_summary.cve_count > 0 && ` \u00b7 ${v.scan_summary.cve_count} CVEs`}
          {v.scan_summary.exposed_services > 0 && ` \u00b7 ${v.scan_summary.exposed_services} exposed services`}
        </div>
      )}

      {/* Grade breakdown (collapsible) */}
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 6, marginTop: 6 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--color-text-dim)',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease', display: 'inline-block' }}>
            &#9654;
          </span>
          Grade breakdown
        </button>
        {expanded && (
          <div
            style={{
              marginTop: 8,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px 16px',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span style={{ color: 'var(--color-text-dim)' }}>Incidents (90d)</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{v.grade_factors.incident_count_90d}</span>
            <span style={{ color: 'var(--color-text-dim)' }}>Total downtime</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{formatHours(v.grade_factors.total_downtime_hours_90d)}</span>
            <span style={{ color: 'var(--color-text-dim)' }}>Avg recovery</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {v.grade_factors.avg_recovery_minutes != null ? `${Math.round(v.grade_factors.avg_recovery_minutes)}min` : '\u2014'}
            </span>
            <span style={{ color: 'var(--color-text-dim)' }}>CVEs</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{v.grade_factors.cve_count ?? 'No scan data'}</span>
            <span style={{ color: 'var(--color-text-dim)' }}>Exposed services</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{v.grade_factors.exposed_services ?? 'No scan data'}</span>
            <span style={{ color: 'var(--color-text-dim)' }}>Repeat failure</span>
            <span style={{ color: v.grade_factors.repeat_failure ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
              {v.grade_factors.repeat_failure ? 'Yes' : 'No'}
            </span>
          </div>
        )}
      </div>

      {/* Alternatives */}
      {showAlternatives(v.grade) && v.alternatives.length > 0 && (
        <AlternativesList alternatives={v.alternatives} network={network} />
      )}
    </div>
  );
}
